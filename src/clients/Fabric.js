import { FrameClient } from "elv-client-js/src/FrameClient";
import { ElvClient } from "elv-client-js/src/ElvClient";
import UrlJoin from "url-join";

import BaseLibraryContract from "elv-client-js/src/contracts/BaseLibrary";
import BaseContentContract from "elv-client-js/src/contracts/BaseContent";
import {Bytes32ToUtf8, EqualAddress, FormatAddress} from "../utils/Helpers";

const Configuration = require("../../configuration.json");

let client;
let isFrameClient = false;

/* Undocumented feature: If privateKey param is set, use that to intialize the client */
let privateKey;
let queryParams = window.location.search.split("?")[1];

if(queryParams) {
  queryParams = queryParams.split("&");

  queryParams.forEach(param => {
    const key = param.split("=")[0];
    if(key === "privateKey") {
      privateKey = param.split("=")[1];
    }
  });
}

if(privateKey || window.self === window.top) {
  if(!privateKey) { privateKey = "0x0000000000000000000000000000000000000000000000000000000000000000"; }

  client = ElvClient.FromConfiguration({configuration: Configuration});
  client.SetSigner({signer: client.GenerateWallet().AddAccount({privateKey})});
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
      return await client.SendMessage({
        options: {
          operation: "GetFramePath"
        }
      });
    }
  },

  async SetFramePath({path}) {
    if(Fabric.isFrameClient) {
      return await client.SendMessage({
        options: {
          operation: "SetFramePath",
          path
        }
      });
    }
  },

  async ExecuteFrameRequest({request, Respond}) {
    if(isFrameClient) {
      Respond(await client.PassRequest({request, Respond}));
    } else {
      Respond(await client.CallFromFrameMessage(request));
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

  ListContentLibraries: async ({params}) => {
    const libraryIds = await client.ContentLibraries();
    let filteredLibraries = await Promise.all(
      libraryIds.map(async libraryId => {
        return {
          libraryId,
          meta: await client.PublicLibraryMetadata({libraryId})
        };
      })
    );

    // Filter libraries
    if(params.filter) {
      filteredLibraries = filteredLibraries.filter(({meta}) => {
        try {
          return meta.name.toLowerCase().includes(params.filter.toLowerCase());
        } catch(e) {
          return false;
        }
      });
    }

    // Sort libraries
    filteredLibraries = filteredLibraries.sort((a, b) => {
      // todo: this should be done in client
      a.meta = a.meta || {};
      b.meta = b.meta || {};
      const name1 = a.meta.name || "zz";
      const name2 = b.meta.name || "zz";
      return name1.toLowerCase() > name2.toLowerCase() ? 1 : -1;
    });

    const count = filteredLibraries.length;

    // Paginate libraries
    const page = (params.page || 1) - 1;
    const perPage = params.perPage || 10;

    filteredLibraries = filteredLibraries.slice(page * perPage, (page+1) * perPage);

    let libraries = {};
    await Promise.all(
      filteredLibraries.map(async ({libraryId}) => {
        try {
          libraries[libraryId] = await Fabric.GetContentLibrary({libraryId});
        } catch(error) {
          /* eslint-disable no-console */
          console.error("Failed to get content library:");
          console.error(error);
          /* eslint-enable no-console */
        }
      })
    );

    return {
      libraries,
      count
    };
  },

  GetContentLibrary: async ({libraryId}) => {
    /* Library */
    const libraryInfo = await client.ContentLibrary({libraryId});
    const owner = await Fabric.GetContentLibraryOwner({libraryId});
    const currentAccountAddress = await Fabric.CurrentAccountAddress();

    /* Library object and private metadata */
    const libraryObjectId = libraryId.replace("ilib", "iq__");
    const libraryObject = await Fabric.GetContentObject({libraryId, objectId: libraryObjectId});
    const privateMeta = await Fabric.GetContentObjectMetadata({
      libraryId,
      objectId: libraryObjectId
    });

    /* Image */
    const imageUrl = await Fabric.GetContentObjectImageUrl({
      libraryId,
      objectId: libraryObjectId,
      versionHash: libraryObject.hash, // Specify version hash to break cache if image is updated,
      metadata: privateMeta
    });

    /* Content */
    const objectIds = (await client.ContentObjects({libraryId})).map(object => object.id)
      .filter(objectId => !Fabric.utils.EqualHash(libraryId, objectId));


    /* Types */
    const types = await Fabric.ListLibraryContentTypes({libraryId});

    return {
      ...libraryInfo,
      libraryId,
      types,
      name: libraryInfo.meta.name || libraryId,
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

    const knownGroups = await Fabric.FabricBrowser.AccessGroups({params: {}});
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
  ListContentObjects: async ({libraryId, params}) => {
    let libraryObjects = (await client.ContentObjects({libraryId}));

    // Exclude library object
    libraryObjects = libraryObjects.filter(object => object.id !== libraryId.replace("ilib", "iq__"));

    // Filter objects
    if(params.filter) {
      libraryObjects = libraryObjects.filter(object => {
        try {
          return object.versions[0].meta.name.toLowerCase().includes(params.filter.toLowerCase());
        } catch(e) {
          return false;
        }
      });
    }

    const count = libraryObjects.length;

    // Sort objects
    libraryObjects = libraryObjects.sort((a, b) => {
      const name1 = a.versions[0].meta.name|| "zz";
      const name2 = b.versions[0].meta.name || "zz";
      return name1.toLowerCase() > name2.toLowerCase() ? 1 : -1;
    });

    // Paginate objects
    const page = params.page - 1;
    const perPage = params.perPage || 10;
    libraryObjects = libraryObjects.slice(page * perPage, (page+1) * perPage);

    let objects = {};
    for (const object of libraryObjects) {
      try {
        const isContentLibraryObject = client.utils.EqualHash(libraryId, object.id);
        const isContentType = libraryId === Fabric.contentSpaceLibraryId && !isContentLibraryObject;
        const isNormalObject = !isContentLibraryObject && !isContentType;

        // Only normal objects have status and access charge
        let status, baseAccessCharge;
        if(isNormalObject) {
          status = await Fabric.GetContentObjectStatus({objectId: object.id});
          baseAccessCharge = await Fabric.GetBaseAccessCharge({objectId: object.id});
        }

        const owner = await Fabric.GetContentObjectOwner({objectId: object.id});

        const latestVersion = object.versions[0];
        const imageUrl = await Fabric.GetContentObjectImageUrl({
          libraryId,
          objectId: object.id,
          versionHash: latestVersion.hash,
          metadata: object.versions[0].meta
        });

        objects[object.id] = {
          // Pull latest version info up to top level
          ...latestVersion,
          ...object,
          name: latestVersion.meta.name,
          description: latestVersion.meta["eluv.description"],
          imageUrl,
          contractAddress: client.utils.HashToAddress(object.id),
          owner,
          isOwner: EqualAddress(owner, await Fabric.CurrentAccountAddress()),
          baseAccessCharge,
          status,
          isContentLibraryObject,
          isContentType,
          isNormalObject
        };
      } catch(error) {
        /* eslint-disable no-console */
        console.error("Failed to list content object " + object.id);
        console.error(error);
        /* eslint-enable no-console */
      }
    }

    return {
      objects,
      count
    };
  },

  GetContentObject: async ({libraryId, objectId}) => {
    const isContentLibraryObject = client.utils.EqualHash(libraryId, objectId);
    const isContentType = libraryId === Fabric.contentSpaceLibraryId && !isContentLibraryObject;
    const isNormalObject = !isContentLibraryObject && !isContentType;

    // Only normal objects have status and access charge
    let status, baseAccessCharge;
    if(isNormalObject) {
      status = await Fabric.GetContentObjectStatus({objectId});
      baseAccessCharge = await Fabric.GetBaseAccessCharge({objectId});
    }

    const owner = await Fabric.GetContentObjectOwner({objectId: objectId});

    const object = await client.ContentObject({libraryId, objectId});
    const metadata = await client.ContentObjectMetadata({libraryId, objectId});
    const imageUrl = await Fabric.GetContentObjectImageUrl({libraryId, objectId, versionHash: object.hash, metadata});

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

    let videoUrl;
    if(metadata["video"]) {
      videoUrl = await Fabric.FabricUrl({libraryId, objectId, partHash: metadata["video"]});
    }

    return {
      ...object,
      ...appUrls,
      meta: metadata,
      name: metadata.name || object.id,
      description: metadata["eluv.description"],
      typeInfo,
      imageUrl,
      videoUrl,
      contractAddress: FormatAddress(client.utils.HashToAddress(objectId)),
      customContractAddress,
      owner,
      isOwner: EqualAddress(owner, await Fabric.CurrentAccountAddress()),
      baseAccessCharge,
      status,
      isContentLibraryObject,
      isContentType,
      isNormalObject
    };
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
        const parts = (await Fabric.ListParts({libraryId, objectId, versionHash: version.hash}));

        // Must keep versions in order from newest to oldest
        fullVersions[index] = {
          ...version,
          meta: metadata,
          verification,
          parts
        };
      })
    );

    return fullVersions;
  },

  GetContentObjectImageUrl: async ({libraryId, objectId, versionHash, metadata}) => {
    // Ensure image is set in metadata - if not, object has no image
    if(!metadata) { metadata = await client.ContentObjectMetadata({libraryId, objectId}); }
    const imagePartHash = metadata["image"];
    if(!imagePartHash) { return; }

    return await client.Rep({libraryId, objectId, versionHash, rep: "image", noAuth: true});
  },

  GetCustomContentContractAddress: async ({libraryId, objectId, metadata={}}) => {
    if(libraryId === Fabric.contentSpaceLibraryId || client.utils.EqualHash(libraryId, objectId)) {
      // Content type or content library object - look at metadata
      return metadata.custom_contract && metadata.custom_contract.address;
    }

    return FormatAddress(await client.CustomContractAddress({libraryId, objectId}));
  },

  GetContentObjectOwner: async ({objectId}) => {
    return FormatAddress(await client.ContentObjectOwner({objectId}));
  },

  GetBaseAccessCharge: async ({objectId}) => {
    let accessCharge = await client.CallContractMethod({
      contractAddress: Fabric.utils.HashToAddress(objectId),
      abi: BaseContentContract.abi,
      methodName: "accessCharge"
    });
    accessCharge = parseInt(accessCharge._hex, 16);

    return Fabric.utils.WeiToEther(accessCharge).toNumber();
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
        name,
        "eluv.description": description
      },
      bitcode
    });
  },

  AppUrls: async ({object}) => {
    if(!object || !object.meta) { return {}; }

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

  SetAccessCharge: async ({objectId, accessCharge}) => {
    let currentAccessCharge = await Fabric.CallContractMethod({
      contractAddress: Fabric.utils.HashToAddress(objectId),
      abi: BaseContentContract.abi,
      methodName: "accessCharge",
    });
    currentAccessCharge = parseInt(currentAccessCharge._hex, 16);

    const accessChargeWei = Fabric.utils.EtherToWei(accessCharge);

    // Access charge is the same, no need to update
    if(accessChargeWei.isEqualTo(currentAccessCharge)) { return; }

    await Fabric.CallContractMethodAndWait({
      contractAddress: Fabric.utils.HashToAddress(objectId),
      abi: BaseContentContract.abi,
      methodName: "setAccessCharge",
      methodArgs: [accessChargeWei]
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

  UploadPart: ({libraryId, objectId, writeToken, data, callback, chunkSize=1000000, encrypted=true}) => {
    return client.UploadPart({libraryId, objectId, writeToken, data, callback, chunkSize, encrypted});
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

  SetCustomContentContract: ({
    libraryId,
    objectId,
    name,
    description,
    customContractAddress,
    abi,
    factoryAbi,
    overrides={}
  }) => {
    return client.SetCustomContentContract({
      libraryId,
      objectId,
      name,
      description,
      customContractAddress,
      abi,
      factoryAbi,
      overrides
    });
  },

  ContractEvent: ({abi, transactionHash}) => {
    return client.ContractEvent({abi, transactionHash});
  },

  ContractEvents: async ({contractAddress, abi, fromBlock, toBlock}) => {
    return await client.ContractEvents({contractAddress, abi, fromBlock, toBlock, includeTransaction: true});
  },

  WithdrawContractFunds: ({contractAddress, abi, ether}) => {
    return client.WithdrawContractFunds({contractAddress, abi, ether});
  },

  GetBlockchainEvents: ({toBlock, fromBlock, count=10}) => {
    return client.Events({toBlock, fromBlock, count, includeTransaction: true});
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
      const info = await Fabric.GetContentObjectMetadata({
        libraryId: Fabric.contentSpaceLibraryId,
        objectId: Fabric.contentSpaceObjectId,
        metadataSubtree: UrlJoin("elv-fabric-browser", subtree)
      });

      if(!info && ["contracts", "deployedContracts", "accessGroups"].includes(subtree)) {
        await Fabric.FabricBrowser.Initialize();
      }

      return info || {};
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
            metadataSubtree: UrlJoin("elv-fabric-browser", type, name),
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
            metadataSubtree: UrlJoin("elv-fabric-browser", type, name),
          });
        }
      });
    },

    /* Access Groups */

    async AccessGroups({params}) {
      let accessGroups = await Fabric.FabricBrowser.Info("accessGroups");
      const currentAccountAddress = await Fabric.CurrentAccountAddress();

      let filteredAccessGroups = Object.values(accessGroups);

      filteredAccessGroups = filteredAccessGroups.map(accessGroup =>
        ({
          ...accessGroup,
          isOwner: EqualAddress(accessGroup.owner, currentAccountAddress),
          isManager: Object.values(accessGroup.members)
            .some(member => member.manager && EqualAddress(member.address, currentAccountAddress))
        })
      );

      // Filter
      if(params.filter) {        
        filteredAccessGroups = filteredAccessGroups.filter(accessGroup => {
          try {
            return accessGroup.name.toLowerCase().includes(params.filter.toLowerCase());
          } catch(e) {
            return false;
          }
        });
      }

      // Sort
      filteredAccessGroups = filteredAccessGroups.sort((a, b) => {
        const name1 = a.name || "zz";
        const name2 = b.name || "zz";
        return name1.toLowerCase() > name2.toLowerCase() ? 1 : -1;
      });

      const count = filteredAccessGroups.length;

      if(params.paginate) {
        // Paginate
        const page = (params.page || 1) - 1;
        const perPage = params.perPage || 10;

        filteredAccessGroups = filteredAccessGroups.slice(page * perPage, (page + 1) * perPage);
      }

      // Convert back to map
      accessGroups = {};
      filteredAccessGroups.forEach(accessGroup => accessGroups[accessGroup.address] = accessGroup);

      return {accessGroups, count};
    },

    async GetAccessGroup({contractAddress}) {
      const currentAccountAddress = await Fabric.CurrentAccountAddress();
      const accessGroup = (await Fabric.FabricBrowser.Info("accessGroups"))[contractAddress];

      accessGroup.isOwner = EqualAddress(accessGroup.owner, currentAccountAddress);
      accessGroup.isManager = Object.values(accessGroup.members)
        .some(member => member.manager && EqualAddress(member.address, currentAccountAddress));

      return accessGroup;
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

    async AccessGroupMembers({contractAddress, params}) {
      const accessGroup = await Fabric.FabricBrowser.GetAccessGroup({contractAddress});
      const currentAccountAddress = await Fabric.CurrentAccountAddress();
      
      let filteredMembers = Object.values(accessGroup.members);

      filteredMembers = filteredMembers.map(member =>
        ({
          ...member,
          isCurrentAccount: EqualAddress(member.address, currentAccountAddress)
        })
      );

      // Filter
      if(params.filter) {
        filteredMembers = filteredMembers.filter(member => {
          try {
            return member.name.toLowerCase().includes(params.filter.toLowerCase());
          } catch(e) {
            return false;
          }
        });
      }

      // Sort
      filteredMembers = filteredMembers.sort((a, b) => {
        const name1 = a.name || "zz";
        const name2 = b.name || "zz";
        return name1.toLowerCase() > name2.toLowerCase() ? 1 : -1;
      });

      const count = filteredMembers.length;

      if(params.paginate) {
        // Paginate
        const page = (params.page || 1) - 1;
        const perPage = params.perPage || 10;

        filteredMembers = filteredMembers.slice(page * perPage, (page + 1) * perPage);
      }

      // Convert back to map
      let members = {};
      filteredMembers.forEach(member => members[member.address] = member);

      return {members, count};
    },

    /* Contracts */
    
    FilterContracts({contracts, params}) {
      let filteredContracts = Object.values(contracts);

      // Filter
      if(params.filter) {
        filteredContracts = filteredContracts.filter(contract => {
          try {
            return contract.name.toLowerCase().includes(params.filter.toLowerCase());
          } catch(e) {
            return false;
          }
        });
      }

      // Sort
      filteredContracts = filteredContracts.sort((a, b) => {
        const name1 = a.name || "zz";
        const name2 = b.name || "zz";
        return name1.toLowerCase() > name2.toLowerCase() ? 1 : -1;
      });

      const count = filteredContracts.length;

      if(params.paginate) {
        // Paginate
        const page = (params.page || 1) - 1;
        const perPage = params.perPage || 10;

        filteredContracts = filteredContracts.slice(page * perPage, (page + 1) * perPage);
      }

      // Convert back to map
      contracts = {};
      filteredContracts.forEach(contract => contracts[contract.address || contract.name] = contract);

      return {contracts, count};
    },

    async Contracts({params}) {
      return Fabric.FabricBrowser.FilterContracts({
        contracts: await Fabric.FabricBrowser.Info("contracts"),
        params
      });
    },

    async DeployedContracts({params}) {
      return Fabric.FabricBrowser.FilterContracts({
        contracts: await Fabric.FabricBrowser.Info("deployedContracts"),
        params
      });
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
