import { FrameClient } from "elv-client-js/ElvFrameClient-min";
import { ElvClient } from "elv-client-js/src/ElvClient";
import ContentObject from "../models/ContentObject";
import URI from "urijs";
import Path from "path";

import BaseLibraryContract from "elv-client-js/src/contracts/BaseLibrary";
import BaseContentContract from "elv-client-js/src/contracts/BaseContent";

const Configuration = require("../../configuration.json");
const Ethers = require("ethers");

let client;

if(window.self === window.top) {
  client = ElvClient.FromConfiguration({configuration: Configuration});

  let wallet = client.GenerateWallet();
  let signer = wallet.AddAccount({
    accountName: "Alice",
    //privateKey: "0x0000000000000000000000000000000000000000000000000000000000000000"
    privateKey: "0x0000000000000000000000000000000000000000000000000000000000000000"
  });
  client.SetSigner({signer});
} else {
  // Contained in IFrame
  client = new FrameClient({
    target: window.parent,
    timeout: 15
  });
}

const Fabric = {
  /* Utils */
  // TODO: Get the content space ID in the frameclient from parent
  contentSpaceId: Configuration.fabric.contentSpaceId,
  contentSpaceLibraryId: Configuration.fabric.contentSpaceId.replace("ispc", "ilib"),
  utils: client.utils,

  CurrentAccountAddress: async () => {
    return await client.CurrentAccountAddress();
  },

  /* Access Groups */

  CreateAccessGroup: async () => {
    return await client.CreateAccessGroup();
  },

  FormatAddress: (address) => {
    if(!address.startsWith("0x")) { address = "0x" + address; }
    return address.toLowerCase();
  },

  async AddAccessGroupMember({contractAddress, memberAddress}) {

    return await client.AddAccessGroupMember({
      contractAddress,
      memberAddress: Fabric.FormatAddress(memberAddress)
    });
  },

  async RemoveAccessGroupMember({contractAddress, memberAddress}) {
    return await client.RemoveAccessGroupMember({
      contractAddress,
      memberAddress: Fabric.FormatAddress(memberAddress)
    });
  },

  async AddAccessGroupManager({contractAddress, memberAddress}) {
    return await client.AddAccessGroupManager({
      contractAddress,
      memberAddress: Fabric.FormatAddress(memberAddress)
    });
  },

  async RemoveAccessGroupManager({contractAddress, memberAddress}) {
    return await client.RemoveAccessGroupManager({
      contractAddress,
      memberAddress: Fabric.FormatAddress(memberAddress)
    });
  },

  /* Libraries */

  ListContentLibraries: async () => {
    return await client.ContentLibraries();
  },

  GetContentLibrary: async ({libraryId}) => {
    const contentLibraryData = await client.ContentLibrary({libraryId});
    contentLibraryData.url = await Fabric.FabricUrl({libraryId});

    return contentLibraryData;
  },

  GetContentLibraryOwner: async ({libraryId}) => {
    return await client.ContentLibraryOwner({libraryId});
  },

  CreateContentLibrary: async ({name, description, publicMetadata, privateMetadata}) => {
    return await client.CreateContentLibrary({name, description, publicMetadata, privateMetadata});
  },

  DeleteContentLibrary: async ({libraryId}) => {
    await client.DeleteContentLibrary({libraryId});
  },

  SetContentLibraryImage: async ({libraryId, image}) =>{
    await client.SetContentLibraryImage({libraryId, image});
  },

  ReplacePublicLibraryMetadata: async ({libraryId, metadata}) => {
    return await client.ReplacePublicLibraryMetadata({libraryId, metadata});
  },

  /* Library Groups */

  // Get a list of library groups of the specified type
  // - Get the number of groups by querying <type>GroupsLength
  // - Iterate over the list of <type>Groups to collect the addresses
  // - Check if the address matches a known group - if so include additional information
  CollectLibraryGroups: async ({libraryId, type, knownGroups}) => {
    let numGroups = await client.CallContractMethod({
      contractAddress: client.utils.HashToAddress({hash: libraryId}),
      abi: BaseLibraryContract.abi,
      methodName: type + "GroupsLength"
    });

    numGroups = parseInt(numGroups._hex, 16);

    let groups = [];
    for(let i = 0; i < numGroups; i++) {
      const groupAddress = await client.CallContractMethod({
        contractAddress: client.utils.HashToAddress({hash: libraryId}),
        abi: BaseLibraryContract.abi,
        methodName: type + "Groups",
        methodArgs: [i]
      });

      const knownGroup = Object.values(knownGroups)
        .find(knownGroup => knownGroup.address.toLowerCase() === groupAddress.toLowerCase());

      if(knownGroup) {
        groups.push(knownGroup);
      } else {
        groups.push({
          address: groupAddress
        });
      }
    }

    return groups;
  },

  GetContentLibraryGroups: async ({libraryId}) => {
    const knownGroups = await Fabric.FabricBrowser.AccessGroups();
    return {
      accessor: await Fabric.CollectLibraryGroups({libraryId, type: "accessor", knownGroups}),
      contributor: await Fabric.CollectLibraryGroups({libraryId, type: "contributor", knownGroups}),
      reviewer: await Fabric.CollectLibraryGroups({libraryId, type: "reviewer", knownGroups})
    };
  },

  AddContentLibraryGroup: async ({libraryId, address, groupType}) => {
    try {
      const event = await client.CallContractMethodAndWait({
        contractAddress: client.utils.HashToAddress({hash: libraryId}),
        abi: BaseLibraryContract.abi,
        methodName: "add" + groupType.capitalize() + "Group",
        methodArgs: [Fabric.FormatAddress(address)]
      });

      await client.ExtractEventFromLogs({
        abi: BaseLibraryContract.abi,
        event,
        eventName: groupType.capitalize() + "GroupAdded"
      });
    } catch(error) {
      console.error(error);
      throw Error("Failed to add " + groupType + "group " + address);
    }
  },

  RemoveContentLibraryGroup: async ({libraryId, address, groupType}) => {
    try {
      const event = await client.CallContractMethodAndWait({
        contractAddress: client.utils.HashToAddress({hash: libraryId}),
        abi: BaseLibraryContract.abi,
        methodName: "remove" + groupType.capitalize() + "Group",
        methodArgs: [Fabric.FormatAddress(address)]
      });

      await client.ExtractEventFromLogs({
        abi: BaseLibraryContract.abi,
        event,
        eventName: groupType.capitalize() + "GroupRemoved"
      });
    } catch(error) {
      console.error(error);
      throw Error("Failed to add " + groupType + "group " + address);
    }
  },

  /* Objects */

  ListContentObjects: async ({libraryId}) => {
    const libraryUrl = await client.FabricUrl({libraryId});
    const contentObjectData = await client.ContentObjects({ libraryId });

    // Inject URL and owner into content object
    return {
      contents: await Promise.all(contentObjectData.contents.map(async data => {
        const uri = new URI(libraryUrl);
        uri.path(Path.join(uri.path(), "q", data.id));
        data.url = uri.toString();

        data.owner = await Fabric.GetContentObjectOwner({objectId: data.id});
        return data;
      }))
    };
  },

  GetContentObject: async ({libraryId, objectId}) => {
    const contentObjectData = await client.ContentObject({ libraryId, objectId });
    contentObjectData.url = await Fabric.FabricUrl({libraryId, objectId});

    return contentObjectData;
  },

  GetContentObjectOwner: async ({objectId}) => {
    return await client.ContentObjectOwner({objectId});
  },

  GetContentObjectMetadata: async ({libraryId, objectId, versionHash}) => {
    return await client.ContentObjectMetadata({ libraryId, objectId, versionHash });
  },

  GetContentObjectVersions: async ({libraryId, objectId}) => {
    return await client.ContentObjectVersions({libraryId, objectId});
  },

  GetContentObjectStatus: async ({objectId}) => {
    const result = await Fabric.CallContractMethod({
      contractAddress: client.utils.HashToAddress({hash: objectId}),
      abi: BaseContentContract.abi,
      methodName: "statusDescription",
      methodArgs: []
    });

    return Ethers.utils.toUtf8String(result);
  },

  GetFullContentObject: async ({libraryId, objectId, includeStatus=true}) => {
    let contentObjectData = await Fabric.GetContentObject({ libraryId, objectId });

    const versionHash = contentObjectData.hash;
    contentObjectData.meta = await Fabric.GetContentObjectMetadata({ libraryId, objectId, versionHash });
    contentObjectData.parts = (await Fabric.ListParts({ libraryId, objectId, versionHash })).parts;

    let versions = (await Fabric.GetContentObjectVersions({ libraryId, objectId })).versions;
    for(const version of versions) {
      version.meta = await Fabric.GetContentObjectMetadata({ libraryId, objectId, versionHash: version.hash });
      version.parts = (await Fabric.ListParts({ libraryId, objectId, versionHash: version.hash })).parts;
      version.verification = await Fabric.VerifyContentObject({libraryId, objectId, partHash: version.hash});

      for(const part of version.parts) {
        part.proofs = await Fabric.Proofs({libraryId, objectId, versionHash: version.hash, partHash: part.hash});
      }
    }

    contentObjectData.versions = versions;

    if(includeStatus) {
      contentObjectData.status = await Fabric.GetContentObjectStatus({objectId});
    }

    const owner = await Fabric.GetContentObjectOwner({objectId});

    return new ContentObject({libraryId, owner, contentObjectData});
  },

  /* Object creation / modification */

  CreateContentObject: async ({
    libraryId,
    type,
    metadata = {}
  }) => {
    let requestParams = {
      type,
      meta: metadata
    };

    return client.CreateContentObject({
      libraryId: libraryId,
      options: requestParams
    });
  },

  DeleteContentObject: async ({libraryId, objectId}) => {
    await client.DeleteContentObject({libraryId, objectId});
  },

  DeleteContentVersion: async ({libraryId, objectId, versionHash}) => {
    await client.DeleteContentVersion({libraryId, objectId, versionHash});
  },

  EditContentObject: async ({
    libraryId,
    objectId
  }) => {
    return await client.EditContentObject({
      libraryId,
      objectId,
      options: {}
    });
  },

  MergeMetadata: async ({
    libraryId,
    objectId,
    writeToken,
    metadataSubtree,
    metadata
  }) => {
    await client.MergeMetadata({
      libraryId,
      objectId,
      writeToken,
      metadataSubtree,
      metadata
    });
  },

  ReplaceMetadata: async ({
    libraryId,
    objectId,
    writeToken,
    metadataSubtree,
    metadata
  }) => {
    await client.ReplaceMetadata({
      libraryId,
      objectId,
      writeToken,
      metadataSubtree,
      metadata
    });
  },

  DeleteMetadata: async ({
    libraryId,
    objectId,
    writeToken,
    metadataSubtree
  }) => {
    await client.DeleteMetadata({
      libraryId,
      objectId,
      writeToken,
      metadataSubtree
    });
  },

  FinalizeContentObject: async ({
    libraryId,
    objectId,
    writeToken
  }) => {
    return await client.FinalizeContentObject({
      libraryId,
      objectId,
      writeToken
    });
  },

  // Convenience function to create and finalize object immediately
  // -- takes same arguments as CreateContentObject
  CreateAndFinalizeContentObject: async ({
    libraryId,
    type,
    metadata={}
  }) => {
    let createResponse = await Fabric.CreateContentObject({
      libraryId,
      type,
      metadata
    });

    return (
      await Fabric.FinalizeContentObject({
        libraryId,
        objectId: createResponse.id,
        writeToken: createResponse.write_token
      })
    );
  },

  EditAndFinalizeContentObject: async({
    libraryId,
    objectId,
    todo
  }) => {
    const editResponse = await Fabric.EditContentObject({libraryId, objectId});

    await todo({writeToken: editResponse.write_token});

    await Fabric.FinalizeContentObject({libraryId, objectId, writeToken: editResponse.write_token});
  },

  /* Files */

  CreateFileUploadJob: ({libraryId, objectId, writeToken, fileInfo}) => {
    return client.CreateFileUploadJob({libraryId, objectId, writeToken, fileInfo});
  },

  UploadFileData: ({libraryId, objectId, writeToken, jobId, fileData}) => {
    return client.UploadFileData({libraryId, objectId, writeToken, jobId, fileData});
  },

  GetUploadJobStatus: ({libraryId, objectId, writeToken, jobId}) => {
    return client.UploadJobStatus({libraryId, objectId, writeToken, jobId});
  },

  FinalizeUploadJobs: ({libraryId, objectId, writeToken}) => {
    return client.FinalizeUploadJobs({libraryId, objectId, writeToken});
  },

  DownloadFiles: ({libraryId, objectId, writeToken, filePath}) => {
    return client.DownloadFiles({libraryId, objectId, writeToken, filePath});
  },

  /* Parts */

  ListParts: ({libraryId, objectId, versionHash}) => {
    return client.ContentParts({libraryId, objectId, versionHash});
  },

  DownloadPart: ({libraryId, objectId ,versionHash, partHash, format}) => {
    return client.DownloadPart({ libraryId, objectId, versionHash, partHash, format});
  },

  UploadPart: ({libraryId, objectId, writeToken, data}) => {
    return client.UploadPart({libraryId, objectId, writeToken, data});
  },

  FabricUrl: ({libraryId, objectId, versionHash, partHash}) => {
    return client.FabricUrl({libraryId, objectId, versionHash, partHash});
  },

  /* Contracts */
  FormatContractArguments: ({abi, methodName, args}) => {
    return client.FormatContractArguments({abi, methodName, args});
  },

  DeployContract: ({abi, bytecode, constructorArgs}) => {
    return client.DeployContract({abi, bytecode, constructorArgs});
  },

  CallContractMethod: ({contractAddress, abi, methodName, methodArgs}) => {
    return client.CallContractMethod({contractAddress, abi, methodName, methodArgs});
  },

  CallContractMethodAndWait: ({contractAddress, abi, methodName, methodArgs}) => {
    return client.CallContractMethodAndWait({contractAddress, abi, methodName, methodArgs});
  },

  SetCustomContentContract: ({objectId, customContractAddress, overrides={}}) => {
    return client.SetCustomContentContract({
      objectId,
      customContractAddress,
      overrides
    });
  },

  ContentObjectContractEvents: ({objectId}) => {
    return client.ContentObjectContractEvents({objectId});
  },

  ContractEvents: ({contractAddress, abi}) => {
    return client.ContractEvents({contractAddress, abi});
  },

  WithdrawContractFunds: ({contractAddress, abi, ether}) => {
    return client.WithdrawContractFunds({contractAddress, abi, ether});
  },

  /* Naming */

  async GetByName({name}) {
    try {
      return await client.GetByName({name});
    } catch(error) {
      if(error.status === 404) {
        return undefined;
      }

      throw error;
    }
  },

  SetByName({name, target}) {
    return client.SetByName({name, target});
  },

  async GetObjectByName({name}) {
    try {
      let objectData = await client.GetObjectByName({name});

      return new ContentObject({contentObjectData: objectData});
    } catch(error) {
      if(error.status === 404) {
        return undefined;
      }

      throw error;
    }
  },

  SetObjectByName({name, libraryId, objectId}) {
    return client.SetObjectByName({name, libraryId, objectId});
  },

  DeleteName({name}) {
    return client.DeleteName({name});
  },

  VerifyContentObject: ({
    libraryId,
    objectId,
    partHash
  }) => {
    return client.VerifyContentObject({libraryId, objectId, partHash});
  },

  Proofs: ({libraryId, objectId, versionHash, partHash}) => {
    return client.Proofs({libraryId, objectId, versionHash, partHash});
  },

  GetBalance: ({address}) => {
    return client.GetBalance({address});
  },

  SendFunds: ({sender, recipient, ether}) => {
    return client.SendFunds({sender, recipient, ether});
  },

  FabricBrowser: {
    // Get info pointing to fabric browser library and its entry objects
    async Info() {
      try {
        const info = await client.GetByName({
          name: "elv-fabric-browser"
        });

        return JSON.parse(info.target);
      } catch(error) {
        if(error.status === 404) {
          throw new Error("Please run the seed script to initialize the fabric browser");
        } else {
          throw error;
        }
      }
    },

    async Entries({type}) {
      const info = await Fabric.FabricBrowser.Info();

      return (await Fabric.GetContentObjectMetadata({
        libraryId: info.libraryId,
        objectId: info[type]
      }))[type] || {};
    },

    // Add entry by appending to object metadata
    async AddEntry({type, name, metadata={}}) {
      const info = await Fabric.FabricBrowser.Info();

      await Fabric.EditAndFinalizeContentObject({
        libraryId: info.libraryId,
        objectId: info[type],
        todo: async ({writeToken}) => {
          await Fabric.ReplaceMetadata({
            libraryId: info.libraryId,
            objectId: info[type],
            writeToken,
            metadataSubtree: Path.join(type, name),
            metadata
          });
        }
      });
    },

    // Remove entry by info deleting from object metadata
    async RemoveEntry({type, name}) {
      const info = await Fabric.FabricBrowser.Info();

      await Fabric.EditAndFinalizeContentObject({
        libraryId: info.libraryId,
        objectId: info[type],
        todo: async ({writeToken}) => {
          await Fabric.DeleteMetadata({
            libraryId: info.libraryId,
            writeToken,
            metadataSubtree: Path.join(type, name),
          });
        }
      });
    },

    /* Access Groups */

    async AccessGroups() {
      let accessGroups = await Fabric.FabricBrowser.Entries({type: "accessGroups"});

      // Inject owner address into access groups
      await Promise.all(Object.values(accessGroups).map(async accessGroup => {
        const owner = await Fabric.FabricBrowser.GetAccessGroupOwner({contractAddress: accessGroup.address});
        accessGroups[accessGroup.name].owner = owner;
      }));

      return accessGroups;
    },

    async GetAccessGroupOwner({name, contractAddress}) {
      if(!contractAddress) {
        contractAddress = Fabric.FabricBrowser.AccessGroups()[name].address;
      }
      return await client.AccessGroupOwner({contractAddress});
    },

    async AddAccessGroup({creator, name, description, address, members={}}) {
      await Fabric.FabricBrowser.AddEntry({
        type: "accessGroups",
        name,
        metadata: {
          creator,
          name,
          description,
          address,
          members
        }
      });
    },

    async RemoveAccessGroup({name, contractAddress}) {
      await client.DeleteAccessGroup({contractAddress});
      await Fabric.FabricBrowser.RemoveEntry({type: "accessGroups", name});
    },

    /* Contracts */

    async Contracts() {
      return await Fabric.FabricBrowser.Entries({type: "contracts"});
    },

    async AddContract({name, description, abi, bytecode}) {
      await Fabric.FabricBrowser.AddEntry({
        type: "contracts",
        name,
        metadata: {
          description,
          abi,
          bytecode
        }
      });
    },

    async RemoveContract({name}) {
      await Fabric.FabricBrowser.RemoveEntry({type: "contracts", name});
    }
  }
};



export default Fabric;
