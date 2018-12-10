import { FrameClient } from "elv-client-js/ElvFrameClient-min";
import { ElvClient } from "elv-client-js/src/ElvClient";
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

  DeleteAccessGroup: async ({contractAddress}) => {
    return await client.DeleteAccessGroup({contractAddress});
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
    const libraryIds = await client.ContentLibraries();

    let contentLibraries = {};
    await Promise.all(
      libraryIds.map(async libraryId => {
        contentLibraries[libraryId] = await Fabric.GetContentLibrary({libraryId});
      })
    );

    return contentLibraries;
  },

  GetContentLibrary: async ({libraryId}) => {
    const libraryInfo = await client.ContentLibrary({libraryId});
    const objectIds = (await client.ContentObjects({libraryId})).contents.map(object => object.id)
      .filter(objectId => !Fabric.utils.EqualHash(libraryId, objectId));
    const imageUrl = await Fabric.GetContentObjectImageUrl({
      libraryId,
      objectId: libraryId.replace("ilib", "iq__")
    });
    const privateMeta = await Fabric.GetContentObjectMetadata({
      libraryId,
      objectId: libraryId.replace("ilib", "iq__")
    });

    return {
      ...libraryInfo,
      libraryId,
      name: libraryInfo.meta["eluv.name"],
      description: libraryInfo.meta["eluv.description"],
      privateMeta,
      imageUrl,
      objects: objectIds,
      owner: await Fabric.GetContentLibraryOwner({libraryId})
    };
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
    if(libraryId === Fabric.contentSpaceLibraryId) {
      return {
        accessor: [],
        contributor: [],
        reviewer: []
      };
    }

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
      throw Error("Failed to add " + groupType + "group " + address);
    }
  },

  /* Objects */

  // Make sure not to call anything requiring content object authorization
  ListContentObjects: async ({libraryId}) => {
    const libraryObjects = (await client.ContentObjects({libraryId})).contents;

    let objects = {};
    for (const object of libraryObjects) {
      // Skip library content object
      if (Fabric.utils.EqualHash(libraryId, object.id)) { continue; }

      const latestVersion = object.versions[0];
      const imageUrl = await Fabric.GetContentObjectImageUrl({
        libraryId,
        objectId: object.id,
        metadata: object.versions[0].meta
      });

      objects[object.id] = {
        // Pull latest version info up to top level
        ...latestVersion,
        ...object,
        name: latestVersion.meta["eluv.name"],
        description: latestVersion.meta["eluv.description"],
        imageUrl,
        contractAddress: client.utils.HashToAddress({hash: object.id}),
        owner: await Fabric.GetContentObjectOwner({objectId: object.id})
      };
    }

    return objects;
  },

  GetContentObject: async ({libraryId, objectId}) => {
    const object = await client.ContentObject({libraryId, objectId});
    const metadata = await client.ContentObjectMetadata({libraryId, objectId});
    const imageUrl = await Fabric.GetContentObjectImageUrl({libraryId, objectId});

    // Get the object status unless it is a content type or library object
    let status;
    if(libraryId !== Fabric.contentSpaceLibraryId && !Fabric.utils.EqualHash(libraryId, objectId)) {
      status = await Fabric.GetContentObjectStatus({objectId});
    }

    return {
      ...object,
      meta: metadata,
      name: metadata["eluv.name"],
      description: metadata["eluv.description"],
      imageUrl,
      contractAddress: client.utils.HashToAddress({hash: objectId}),
      owner: await Fabric.GetContentObjectOwner({objectId: object.id}),
      status
    };
  },

  GetContentObjectImageUrl: async ({libraryId, objectId, metadata}) => {
    if(!metadata) { metadata = await client.ContentObjectMetadata({libraryId, objectId}); }

    const imagePartHash = metadata["image"] || metadata["eluv.image"];

    if(!imagePartHash) { return; }

    return await client.Rep({libraryId, objectId, rep: "image"});
  },

  GetContentObjectOwner: async ({objectId}) => {
    return await client.ContentObjectOwner({objectId});
  },

  GetContentObjectMetadata: async ({libraryId, objectId, versionHash}) => {
    return await client.ContentObjectMetadata({ libraryId, objectId, versionHash });
  },

  // Get all versions of the specified content object, along with metadata,
  // parts with proofs, and verification
  GetContentObjectVersions: async({libraryId, objectId}) => {
    const versions = (await client.ContentObjectVersions({libraryId, objectId})).versions;

    let fullVersions = [];
    await Promise.all(
      versions.map(async (version, index) => {
        const metadata = await Fabric.GetContentObjectMetadata({libraryId, objectId, versionHash: version.hash});
        const verification = await Fabric.VerifyContentObject({libraryId, objectId, partHash: version.hash});
        const parts = (await Fabric.ListParts({ libraryId, objectId, versionHash: version.hash })).parts;

        const partsWithProofs = await Promise.all(
          parts.map(async part => {
            const proofs = await Fabric.Proofs({libraryId, objectId, versionHash: version.hash, partHash: part.hash});

            return {
              ...part,
              proofs
            };
          })
        );

        // Must keep versions in order from newest to oldest
        fullVersions[index] = {
          ...version,
          meta: metadata,
          verification,
          parts: partsWithProofs,
        };
      })
    );

    return fullVersions;
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
    objectId,
    options={}
  }) => {
    return await client.EditContentObject({
      libraryId,
      objectId,
      options
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

  /* Content Types */

  CreateContentType: async ({name, description, metadata={}, bitcode}) => {
    return await client.CreateContentType({
      metadata: {
        ...metadata,
        "eluv.name": name,
        "eluv.description": description
      },
      bitcode
    });
  },

  ListContentTypes: async () => {
    return await client.ContentTypes();
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

      return objectData;
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

    async AddAccessGroup({name, description, address, members={}}) {
      await Fabric.FabricBrowser.AddEntry({
        type: "accessGroups",
        name,
        metadata: {
          name,
          description,
          address,
          members
        }
      });
    },

    async RemoveAccessGroup({name}) {
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
