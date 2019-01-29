import { FrameClient } from "elv-client-js/src/FrameClient";
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
    //privateKey: "0x0000000000000000000000000000000000000000000000000000000000000000"
    privateKey: "0x0000000000000000000000000000000000000000000000000000000000000000"
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
  contentSpaceObjectId: Configuration.fabric.contentSpaceId.replace("ispc", "iq__"),
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

  async ExecuteFrameRequest({event}) {
    if(isFrameClient) {
      return await client.PassRequest({request: event.data});
    } else {
      return await client.CallFromFrameMessage(event.data);
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
    const objectIds = (await client.ContentObjects({libraryId})).map(object => object.id)
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
    const name = libraryInfo.meta.name || libraryInfo.meta["eluv.name"] || "Content Library " + libraryId;
    const types = await Fabric.ListLibraryContentTypes({libraryId});
    return {
      ...libraryInfo,
      libraryId,
      types,
      name: name,
      description: libraryInfo.meta["eluv.description"],
      contractAddress: FormatAddress(client.utils.HashToAddress(libraryId)),
      libraryObjectId: libraryId.replace("ilib", "iq__"),
      privateMeta,
      imageUrl,
      objects: objectIds,
      owner,
      isOwner: EqualAddress(owner, currentAccountAddress),
      isContentSpaceLibrary: libraryId === Fabric.contentSpaceLibraryId
    };
  },

  ListLibraryContentTypes: async ({libraryId}) => {
    if(libraryId === Fabric.contentSpaceLibraryId) { return {}; }

    let types = await client.LibraryContentTypes({libraryId});
    await Promise.all(
      Object.keys(types).map(async typeHash => {
        const type = types[typeHash];
        const appUrls = await Fabric.AppUrls({object: type});
        types[typeHash] = {
          ...type,
          ...appUrls
        };
      })
    );

    return types;
  },

  AddLibraryContentType: async ({libraryId, typeId, customContractAddress}) => {
    return await client.AddLibraryContentType({libraryId, typeId, customContractAddress});
  },

  RemoveLibraryContentType: async ({libraryId, typeId}) => {
    return await client.RemoveLibraryContentType({libraryId, typeId});
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
      contractAddress: client.utils.HashToAddress(libraryId),
      abi: BaseLibraryContract.abi,
      methodName: type + "GroupsLength"
    });

    numGroups = parseInt(numGroups._hex, 16);

    let groups = [];
    for(let i = 0; i < numGroups; i++) {
      const groupAddress = await client.CallContractMethod({
        contractAddress: client.utils.HashToAddress(libraryId),
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
        contractAddress: client.utils.HashToAddress(libraryId),
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
        contractAddress: client.utils.HashToAddress(libraryId),
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
    const libraryObjects = (await client.ContentObjects({libraryId}));

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
          contractAddress: client.utils.HashToAddress(object.id),
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

  GetCustomContentContractAddress: async ({libraryId, objectId, metadata={}}) => {
    if(libraryId === Fabric.contentSpaceLibraryId || client.utils.EqualHash(libraryId, objectId)) {
      // Content type or content library object - look at metadata
      return metadata.customContract && metadata.customContract.address;
    }

    return await client.CustomContractAddress({libraryId, objectId});
  },

  GetContentObject: async ({libraryId, objectId}) => {
    const object = await client.ContentObject({libraryId, objectId});
    const metadata = await client.ContentObjectMetadata({libraryId, objectId});
    const imageUrl = await Fabric.GetContentObjectImageUrl({libraryId, objectId});

    // Retrieve status if normal object
    let status;
    if(libraryId !== Fabric.contentSpaceLibraryId && !client.utils.EqualHash(libraryId, objectId)) {
      status = await Fabric.GetContentObjectStatus({objectId});
    }

    const owner = await Fabric.GetContentObjectOwner({objectId});
    const isContentLibraryObject = client.utils.EqualHash(libraryId, objectId);
    const isContentType = libraryId === Fabric.contentSpaceLibraryId && !isContentLibraryObject;

    let typeInfo;
    if(object.type) {
      typeInfo = await Fabric.GetContentType({versionHash: object.type});
    }

    const customContractAddress = await Fabric.GetCustomContentContractAddress({libraryId, objectId, metadata});
    const appUrls = await Fabric.AppUrls({object: {
      id: object.id,
      hash: object.hash,
      meta: metadata
    }});

    return {
      ...object,
      ...appUrls,
      meta: metadata,
      name: metadata["eluv.name"] || metadata["name"],
      description: metadata["eluv.description"],
      typeInfo,
      imageUrl,
      contractAddress: FormatAddress(client.utils.HashToAddress(objectId)),
      customContractAddress,
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

  GetContentObjectMetadata: async ({libraryId, objectId, versionHash, metadataSubtree="/"}) => {
    return await client.ContentObjectMetadata({libraryId, objectId, versionHash, metadataSubtree});
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
      await todo(createResponse.write_token);
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
    await todo(editResponse.write_token);

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

  AppUrls: async ({object}) => {
    const apps = ["display", "manage", "review"];

    const appUrls = {};
    // Inject app URLs, if present
    for(const appName of apps) {
      if(object.meta[`eluv.${appName}App`]) {
        appUrls[`${appName}AppUrl`] = await Fabric.FileUrl({
          libraryId: Fabric.contentSpaceLibraryId,
          objectId: object.id,
          versionHash: object.hash,
          filePath: object.meta[`eluv.${appName}App`]
        });
      }
    }

    return appUrls;
  },

  ListContentTypes: async ({latestOnly=true}) => {
    let contentTypes = await client.ContentTypes({latestOnly});

    for(const typeHash of Object.keys(contentTypes)) {
      const appUrls = await Fabric.AppUrls({object: contentTypes[typeHash]});
      contentTypes[typeHash] = {
        ...contentTypes[typeHash],
        ...appUrls
      };
    }

    return contentTypes;
  },

  GetContentType: async ({versionHash}) => {
    const type = await client.ContentType({versionHash});
    const appUrls = await Fabric.AppUrls({object: type});
    return {
      ...type,
      ...appUrls
    };
  },

  /* Contract calls */

  GetContentLibraryPermissions: async ({libraryId}) => {
    const currentAccountAddress = await client.CurrentAccountAddress();

    const canContribute = await Fabric.CallContractMethod({
      contractAddress: client.utils.HashToAddress(libraryId),
      abi: BaseLibraryContract.abi,
      methodName: "canContribute",
      methodArgs: [currentAccountAddress]
    });

    const canReview = await Fabric.CallContractMethod({
      contractAddress: client.utils.HashToAddress(libraryId),
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
      contractAddress: client.utils.HashToAddress(objectId),
      abi: BaseContentContract.abi,
      methodName: "statusCode",
      methodArgs: []
    });

    const statusDescription = await Fabric.CallContractMethod({
      contractAddress: client.utils.HashToAddress(objectId),
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
      contractAddress: client.utils.HashToAddress(objectId),
      abi: BaseContentContract.abi,
      methodName: "publish",
      methodArgs: []
    });
  },

  ReviewContentObject: async ({libraryId, objectId, approve, note}) => {
    await client.CallContractMethodAndWait({
      contractAddress: client.utils.HashToAddress(libraryId),
      abi: BaseLibraryContract.abi,
      methodName: "approveContent",
      methodArgs: [
        client.utils.HashToAddress(objectId), // Object contract address,
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

  FileUrl: ({libraryId, objectId, versionHash, filePath}) => {
    return client.FileUrl({libraryId, objectId, versionHash, filePath});
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

  GetBlockchainEvents: ({toBlock, fromBlock, count=10}) => {
    return client.Events({toBlock, fromBlock, count});
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
    // Initialize metadata structure in content space object
    async Initialize() {
      await Fabric.EditAndFinalizeContentObject({
        libraryId: Fabric.contentSpaceLibraryId,
        objectId: Fabric.contentSpaceObjectId,
        todo: async (writeToken) => {
          await Fabric.ReplaceMetadata({
            libraryId: Fabric.contentSpaceLibraryId,
            objectId: Fabric.contentSpaceObjectId,
            writeToken,
            metadata: {
              "elv-fabric-browser": {
                accessGroups: {},
                contracts: {},
                deployedContracts: {}
              }
            }
          });
        }
      });
    },

    // Get info pointing to fabric browser library and its entry objects
    async Info(subtree="/") {
      try {
        return (await Fabric.GetContentObjectMetadata({
          libraryId: Fabric.contentSpaceLibraryId,
          objectId: Fabric.contentSpaceObjectId,
          metadataSubtree: Path.join("elv-fabric-browser", subtree)
        })) || {};
      } catch(error) {
        if(error.status === 404 && ["contracts", "deployedContracts", "accessGroups"].includes(subtree)) {
          // Not yet initialized
          await Fabric.FabricBrowser.Initialize();

          return await Fabric.FabricBrowser.Info(subtree);
        } else {
          throw error;
        }
      }
    },

    // Add entry by appending to object metadata
    async AddEntry({type, name, metadata={}}) {
      await Fabric.EditAndFinalizeContentObject({
        libraryId: Fabric.contentSpaceLibraryId,
        objectId: Fabric.contentSpaceObjectId,
        todo: async (writeToken) => {
          await Fabric.ReplaceMetadata({
            libraryId: Fabric.contentSpaceLibraryId,
            objectId: Fabric.contentSpaceObjectId,
            writeToken,
            metadataSubtree: Path.join("elv-fabric-browser", type, name),
            metadata
          });
        }
      });
    },

    // Remove entry by info deleting from object metadata
    async RemoveEntry({type, name}) {
      await Fabric.EditAndFinalizeContentObject({
        libraryId: Fabric.contentSpaceLibraryId,
        objectId: Fabric.contentSpaceObjectId,
        todo: async (writeToken) => {
          await Fabric.DeleteMetadata({
            libraryId: Fabric.contentSpaceLibraryId,
            objectId: Fabric.contentSpaceObjectId,
            writeToken,
            metadataSubtree: Path.join("elv-fabric-browser", type, name),
          });
        }
      });
    },

    /* Access Groups */

    async AccessGroups() {
      let accessGroups = await Fabric.FabricBrowser.Info("accessGroups");
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
      return await Fabric.FabricBrowser.Info("contracts");
    },

    async DeployedContracts() {
      return await Fabric.FabricBrowser.Info("deployedContracts");
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
        type: "deployedContracts",
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
        type: "deployedContracts",
        name: address
      });
    }
  }
};



export default Fabric;
