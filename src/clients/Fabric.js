import { FrameClient } from "elv-client-js/ElvFrameClient-min";
import { ElvClient } from "elv-client-js/src/ElvClient";
import Path from "path";

import BaseLibraryContract from "elv-client-js/src/contracts/BaseLibrary";
import BaseContentContract from "elv-client-js/src/contracts/BaseContent";
import {Bytes32ToUtf8, EqualAddress, FormatAddress} from "../utils/Helpers";

const Configuration = require("../../configuration.json");

let client;
let isFrameClient = false;

if(window.self === window.top) {
  client = ElvClient.FromConfiguration({configuration: Configuration});

  let wallet = client.GenerateWallet();
  let signer = wallet.AddAccount({
    accountName: "Alice",
    //privateKey: "04832aec82a6572d9a5782c4af9d7d88b0eb89116349ee484e96b97daeab5ca6"
    privateKey: "0xbf092a5c94988e2f7a1d00d0db309fc492fe38ddb57fc6d102d777373389c5e6"
  });
  client.SetSigner({signer});
} else {
  // Contained in IFrame
  client = new FrameClient({
    target: window.parent,
    timeout: 30
  });

  isFrameClient = true;
}

const Fabric = {
  /* Utils */
  // TODO: Get the content space ID in the frameclient from parent
  isFrameClient,
  contentSpaceId: Configuration.fabric.contentSpaceId,
  contentSpaceLibraryId: Configuration.fabric.contentSpaceId.replace("ispc", "ilib"),
  utils: client.utils,
  currentAccountAddress: undefined,

  async GetFramePath() {
    if(Fabric.isFrameClient) {
      return await client.GetFramePath();
    }
  },

  async SetFramePath({path}) {
    if(Fabric.isFrameClient) {
      await client.SetFramePath({path});
    }
  },

  CurrentAccountAddress: async () => {
    if(!Fabric.currentAccountAddress) {
      Fabric.currentAccountAddress = FormatAddress(await client.CurrentAccountAddress());
    }

    return Fabric.currentAccountAddress;
  },

  /* Access Groups */

  CreateAccessGroup: async () => {
    return await client.CreateAccessGroup();
  },

  DeleteAccessGroup: async ({address}) => {
    return await client.DeleteAccessGroup({contractAddress: address});
  },

  async AddAccessGroupMember({contractAddress, memberAddress}) {
    return await client.AddAccessGroupMember({
      contractAddress,
      memberAddress: FormatAddress(memberAddress)
    });
  },

  async RemoveAccessGroupMember({contractAddress, memberAddress}) {
    return await client.RemoveAccessGroupMember({
      contractAddress,
      memberAddress: FormatAddress(memberAddress)
    });
  },

  async AddAccessGroupManager({contractAddress, memberAddress}) {
    return await client.AddAccessGroupManager({
      contractAddress,
      memberAddress: FormatAddress(memberAddress)
    });
  },

  async RemoveAccessGroupManager({contractAddress, memberAddress}) {
    return await client.RemoveAccessGroupManager({
      contractAddress,
      memberAddress: FormatAddress(memberAddress)
    });
  },

  /* Libraries */

  ListContentLibraries: async () => {
    const libraryIds = await client.ContentLibraries();

    let contentLibraries = {};
    await Promise.all(
      libraryIds.map(async libraryId => {
        try {
          contentLibraries[libraryId] = await Fabric.GetContentLibrary({libraryId});
        } catch(error) {
          console.error("Failed to get content library:");
          console.error(error);
        }
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
    const owner = await Fabric.GetContentLibraryOwner({libraryId});
    const currentAccountAddress = await Fabric.CurrentAccountAddress();

    return {
      ...libraryInfo,
      libraryId,
      name: libraryInfo.meta["eluv.name"],
      description: libraryInfo.meta["eluv.description"],
      contractAddress: FormatAddress(client.utils.HashToAddress({hash: libraryId})),
      libraryObjectId: libraryId.replace("ilib", "iq__"),
      privateMeta,
      imageUrl,
      objects: objectIds,
      owner,
      isOwner: EqualAddress(owner, currentAccountAddress),
      isContentSpaceLibrary: libraryId === Fabric.contentSpaceLibraryId
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
        .find(knownGroup => EqualAddress(knownGroup.address, groupAddress));

      if(knownGroup) {
        groups.push(knownGroup);
      } else {
        groups.push({
          address: FormatAddress(groupAddress)
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
        methodArgs: [FormatAddress(address)]
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
        methodArgs: [FormatAddress(address)]
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
      try {
        // Skip library content object
        if (Fabric.utils.EqualHash(libraryId, object.id)) {
          continue;
        }

        const latestVersion = object.versions[0];
        const imageUrl = await Fabric.GetContentObjectImageUrl({
          libraryId,
          objectId: object.id,
          metadata: object.versions[0].meta
        });

        // Retrieve status if normal object
        let status;
        if (libraryId !== Fabric.contentSpaceLibraryId && !client.utils.EqualHash(libraryId, object.id)) {
          status = await Fabric.GetContentObjectStatus({objectId: object.id});
        }

        const owner = await Fabric.GetContentObjectOwner({objectId: object.id});
        const isContentLibraryObject = client.utils.EqualHash(libraryId, object.id);
        const isContentType = libraryId === Fabric.contentSpaceLibraryId && !isContentLibraryObject;

        objects[object.id] = {
          // Pull latest version info up to top level
          ...latestVersion,
          ...object,
          name: latestVersion.meta["eluv.name"] || latestVersion.meta["name"],
          description: latestVersion.meta["eluv.description"],
          imageUrl,
          contractAddress: client.utils.HashToAddress({hash: object.id}),
          owner,
          isOwner: EqualAddress(owner, await Fabric.CurrentAccountAddress()),
          status,
          isContentLibraryObject,
          isContentType,
          isNormalObject: !isContentLibraryObject && !isContentType
        };
      } catch(error) {
        console.error(error);
      }
    }

    return objects;
  },

  GetContentObject: async ({libraryId, objectId}) => {
    const object = await client.ContentObject({libraryId, objectId});
    const metadata = await client.ContentObjectMetadata({libraryId, objectId});
    const imageUrl = await Fabric.GetContentObjectImageUrl({libraryId, objectId});

    // Retrieve status if normal object
    let status;
    if(libraryId !== Fabric.contentSpaceLibraryId && !client.utils.EqualHash(libraryId, objectId)) {
      status =await Fabric.GetContentObjectStatus({objectId});
    }

    const owner = await Fabric.GetContentObjectOwner({objectId});
    const isContentLibraryObject = client.utils.EqualHash(libraryId, objectId);
    const isContentType = libraryId === Fabric.contentSpaceLibraryId && !isContentLibraryObject;

    return {
      ...object,
      meta: metadata,
      name: metadata["eluv.name"] || metadata["name"],
      description: metadata["eluv.description"],
      imageUrl,
      contractAddress: FormatAddress(client.utils.HashToAddress({hash: objectId})),
      owner,
      isOwner: EqualAddress(owner, await Fabric.CurrentAccountAddress()),
      status,
      isContentLibraryObject,
      isContentType,
      isNormalObject: !isContentLibraryObject && !isContentType
    };
  },

  GetContentObjectImageUrl: async ({libraryId, objectId, metadata}) => {
    if(!metadata) { metadata = await client.ContentObjectMetadata({libraryId, objectId}); }

    const imagePartHash = metadata["image"] || metadata["eluv.image"];

    if(!imagePartHash) { return; }

    return await client.Rep({libraryId, objectId, rep: "image"});
  },

  GetContentObjectOwner: async ({objectId}) => {
    return FormatAddress(await client.ContentObjectOwner({objectId}));
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
        const verification = await Fabric.VerifyContentObject({libraryId, objectId, versionHash: version.hash});
        const parts = (await Fabric.ListParts({libraryId, objectId, versionHash: version.hash})).parts;

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
    metadataSubtree="/",
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
    metadataSubtree="/",
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
    metadataSubtree="/"
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
    metadata={},
    todo
  }) => {
    let createResponse = await Fabric.CreateContentObject({
      libraryId,
      type,
      metadata
    });

    if(todo) {
      await todo({writeToken: createResponse.write_token});
    }

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

  ListContentTypes: async ({latestOnly=true}) => {
    return await client.ContentTypes({latestOnly});
  },

  /* Contract calls */

  GetContentLibraryPermissions: async ({libraryId}) => {
    const currentAccountAddress = await client.CurrentAccountAddress();

    const canContribute = await Fabric.CallContractMethod({
      contractAddress: client.utils.HashToAddress({hash: libraryId}),
      abi: BaseLibraryContract.abi,
      methodName: "canContribute",
      methodArgs: [currentAccountAddress]
    });

    const canReview = await Fabric.CallContractMethod({
      contractAddress: client.utils.HashToAddress({hash: libraryId}),
      abi: BaseLibraryContract.abi,
      methodName: "canReview",
      methodArgs: [currentAccountAddress]
    });

    return {
      canContribute,
      canReview
    };
  },

  // eslint-disable-next-line no-unused-vars
  GetContentObjectPermissions: async ({libraryId, objectId}) => {
    // All current object permissions are inherited from the library
    return await Fabric.GetContentLibraryPermissions({libraryId});
  },

  GetContentObjectStatus: async ({objectId}) => {
    const statusCode = await Fabric.CallContractMethod({
      contractAddress: client.utils.HashToAddress({hash: objectId}),
      abi: BaseContentContract.abi,
      methodName: "statusCode",
      methodArgs: []
    });

    const statusDescription = await Fabric.CallContractMethod({
      contractAddress: client.utils.HashToAddress({hash: objectId}),
      abi: BaseContentContract.abi,
      methodName: "statusDescription",
      methodArgs: []
    });

    return {
      code: parseInt(statusCode._hex, 16),
      description: Bytes32ToUtf8(statusDescription)
    };
  },

  PublishContentObject: async ({objectId}) => {
    await client.CallContractMethodAndWait({
      contractAddress: client.utils.HashToAddress({hash: objectId}),
      abi: BaseContentContract.abi,
      methodName: "publish",
      methodArgs: []
    });
  },

  ReviewContentObject: async ({libraryId, objectId, approve, note}) => {
    await client.CallContractMethodAndWait({
      contractAddress: client.utils.HashToAddress({hash: libraryId}),
      abi: BaseLibraryContract.abi,
      methodName: "approveContent",
      methodArgs: [
        client.utils.HashToAddress({hash: objectId}), // Object contract address,
        approve,
        note
      ]
    });
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

  UploadFiles: ({libraryId, objectId, writeToken, fileInfo}) => {
    return client.UploadFiles({libraryId, objectId, writeToken, fileInfo});
  },

  DownloadFile: ({libraryId, objectId, versionHash, filePath}) => {
    return client.DownloadFile({libraryId, objectId, versionHash, filePath});
  },

  /* Parts */

  ListParts: ({libraryId, objectId, versionHash}) => {
    return client.ContentParts({libraryId, objectId, versionHash});
  },

  DownloadPart: ({libraryId, objectId ,versionHash, partHash, encrypted}) => {
    return client.DownloadPart({ libraryId, objectId, versionHash, partHash, encrypted});
  },

  UploadPart: ({libraryId, objectId, writeToken, data, encrypted=true}) => {
    return client.UploadPart({libraryId, objectId, writeToken, data, encrypted});
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

  CallContractMethod: ({contractAddress, abi, methodName, methodArgs, value}) => {
    return client.CallContractMethod({contractAddress, abi, methodName, methodArgs, value});
  },

  CallContractMethodAndWait: ({contractAddress, abi, methodName, methodArgs, value}) => {
    return client.CallContractMethodAndWait({contractAddress, abi, methodName, methodArgs, value});
  },

  SetCustomContentContract: ({objectId, customContractAddress, overrides={}}) => {
    return client.SetCustomContentContract({
      objectId,
      customContractAddress,
      overrides
    });
  },

  ContractEvent: ({abi, transactionHash}) => {
    return client.ContractEvent({abi, transactionHash});
  },

  ContractEvents: ({contractAddress, abi, fromBlock, toBlock}) => {
    return client.ContractEvents({contractAddress, abi, fromBlock, toBlock});
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
    versionHash
  }) => {
    return client.VerifyContentObject({libraryId, objectId, versionHash});
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

    async Entries({type, subtree=""}) {
      const info = await Fabric.FabricBrowser.Info();

      return (await Fabric.GetContentObjectMetadata({
        libraryId: info.libraryId,
        objectId: info[type]
      }))[subtree || type] || {};
    },

    // Add entry by appending to object metadata
    async AddEntry({type, subtree="", name, metadata={}}) {
      const info = await Fabric.FabricBrowser.Info();

      await Fabric.EditAndFinalizeContentObject({
        libraryId: info.libraryId,
        objectId: info[type],
        todo: async ({writeToken}) => {
          await Fabric.ReplaceMetadata({
            libraryId: info.libraryId,
            objectId: info[type],
            writeToken,
            metadataSubtree: Path.join(subtree || type, name),
            metadata
          });
        }
      });
    },

    // Remove entry by info deleting from object metadata
    async RemoveEntry({type, subtree="", name}) {
      const info = await Fabric.FabricBrowser.Info();

      await Fabric.EditAndFinalizeContentObject({
        libraryId: info.libraryId,
        objectId: info[type],
        todo: async ({writeToken}) => {
          await Fabric.DeleteMetadata({
            libraryId: info.libraryId,
            writeToken,
            metadataSubtree: Path.join(subtree || type, name),
          });
        }
      });
    },

    /* Access Groups */

    async AccessGroups() {
      let accessGroups = await Fabric.FabricBrowser.Entries({type: "accessGroups"});
      const currentAccountAddress = await Fabric.CurrentAccountAddress();

      Object.keys(accessGroups).map(address => {
        accessGroups[address].isOwner = EqualAddress(accessGroups[address].owner, currentAccountAddress);
      });

      return accessGroups;
    },

    async AddAccessGroup({name, description, address, members={}}) {
      address = FormatAddress(address);

      await Fabric.FabricBrowser.AddEntry({
        type: "accessGroups",
        name: address,
        metadata: {
          name,
          owner: await Fabric.CurrentAccountAddress(),
          description,
          address,
          members
        }
      });
    },

    async RemoveAccessGroup({address}) {
      await Fabric.FabricBrowser.RemoveEntry({type: "accessGroups", name: FormatAddress(address)});
    },

    /* Contracts */

    async Contracts() {
      return await Fabric.FabricBrowser.Entries({type: "contracts"});
    },

    async DeployedContracts() {
      return await Fabric.FabricBrowser.Entries({type: "contracts", subtree: "deployed"});
    },

    async AddContract({name, description, abi, bytecode}) {
      await Fabric.FabricBrowser.AddEntry({
        type: "contracts",
        name,
        metadata: {
          name,
          description,
          abi,
          bytecode
        }
      });
    },

    async RemoveContract({name}) {
      await Fabric.FabricBrowser.RemoveEntry({type: "contracts", name});
    },

    async AddDeployedContract({name, description, address, abi, bytecode, owner}) {
      address = FormatAddress(address);

      await Fabric.FabricBrowser.AddEntry({
        type: "contracts",
        subtree: "deployed",
        name: address,
        metadata: {
          name,
          description,
          address,
          abi,
          bytecode,
          owner
        }
      });
    },

    async RemoveDeployedContract({address}) {
      await Fabric.FabricBrowser.RemoveEntry({
        type: "contracts",
        subtree: "deployed",
        name: address
      });
    }
  }
};



export default Fabric;
