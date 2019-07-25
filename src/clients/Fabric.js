import { FrameClient } from "elv-client-js/src/FrameClient";
import UrlJoin from "url-join";

import BaseLibraryContract from "elv-client-js/src/contracts/BaseLibrary";
import BaseContentContract from "elv-client-js/src/contracts/BaseContent";
import BaseAccessGroupContract from "elv-client-js/src/contracts/BaseAccessControlGroup";
import {Bytes32ToUtf8, EqualAddress, FormatAddress} from "../utils/Helpers";

const APP_REQUESTOR_NAME = "Eluvio Fabric Browser";

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

const isFrameClient = window.self !== window.top;
let client = new FrameClient({
  target: window.parent,
  timeout: 30
});

const Fabric = {
  /* Utils */
  currentAccountAddress: undefined,
  utils: client.utils,
  isFrameClient,

  async Initialize() {
    if(!isFrameClient) {
      const ElvClient = (await import(
        /* webpackChunkName: "elv-client-js" */
        /* webpackMode: "lazy" */
        "elv-client-js"
      )).ElvClient;
      client = await ElvClient.FromConfigurationUrl({configUrl: EluvioConfiguration["config-url"]});
      await client.SetSigner({signer: client.GenerateWallet().AddAccount({privateKey})});
    } else {
      // Contained in IFrame
      client = new FrameClient({
        target: window.parent,
        timeout: 30
      });
    }

    window.fabricBrowserClient = client;

    this.contentSpaceId = await client.ContentSpaceId();
    this.contentSpaceLibraryId = this.contentSpaceId.replace("ispc", "ilib");
  },

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

  CreateAccessGroup: async ({name, metadata={}}) => {
    return await client.CreateAccessGroup({name, metadata});
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

  FilterContentLibraries(libraries, field, value, negate=false) {
    return libraries.filter(({meta}) => {
      try {
        const result = (meta[field] || "").toLowerCase().includes(value);
        return negate ? !result : result;
      } catch(e) {
        return false;
      }
    });
  },

  ListContentLibraries: async ({params}) => {
    const libraryIds = await client.ContentLibraries();
    let filteredLibraries = await Promise.all(
      libraryIds.map(async libraryId => {
        try {
          const libraryObjectId = libraryId.replace("ilib", "iq__");
          // Call library content object to ensure library exists
          await client.ContentObject({libraryId, objectId: libraryObjectId});
          const meta = await client.ContentObjectMetadata({
            libraryId,
            objectId: libraryObjectId
          });

          return {
            libraryId,
            meta
          };
        } catch(error) {
          return {
            libraryId,
            meta: {}
          };
        }
      })
    );

    filteredLibraries = filteredLibraries.filter(library => library !== undefined);

    // Filter libraries by class
    switch(params.selectFilter) {
      case "content":
        filteredLibraries = filteredLibraries.filter(({meta}) =>
          !(["elv-user-library", "elv-media-platform"].includes((meta.class || "").toLowerCase()))
        );
        break;
      case "users":
        filteredLibraries = Fabric.FilterContentLibraries(filteredLibraries, "class", "elv-user-library");
        break;
      case "elv-media-platform":
        filteredLibraries = Fabric.FilterContentLibraries(filteredLibraries, "class", "elv-media-platform");
        break;
    }

    // Filter libraries by specified filter
    if(params.filter) {
      filteredLibraries = Fabric.FilterContentLibraries(filteredLibraries, "name", params.filter.toLowerCase());
    }

    // Sort libraries
    filteredLibraries = filteredLibraries.sort((a, b) => {
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
      filteredLibraries.map(async ({libraryId, meta}) => {
        try {
          const libraryObjectId = libraryId.replace("ilib", "iq__");
          /* Image */
          const imageUrl = await Fabric.GetContentObjectImageUrl({
            libraryId,
            objectId: libraryObjectId,
            metadata: meta
          });
          libraries[libraryId] = {
            libraryId,
            name: meta.name || libraryId,
            description: meta["eluv.description"],
            imageUrl,
            isContentSpaceLibrary: libraryId === Fabric.contentSpaceLibraryId
          };
        } catch(error) {
          /* eslint-disable no-console */
          console.error(`Failed to get content library ${meta.name || libraryId}: `);
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
    let privateMeta = {};
    let imageUrl;
    try {
      const libraryObject = await Fabric.GetContentObject({libraryId, objectId: libraryObjectId});
      privateMeta = await Fabric.GetContentObjectMetadata({
        libraryId,
        objectId: libraryObjectId
      });

      /* Image */
      imageUrl = await Fabric.GetContentObjectImageUrl({
        libraryId,
        objectId: libraryObjectId,
        versionHash: libraryObject.hash, // Specify version hash to break cache if image is updated,
        metadata: privateMeta
      });
    } catch(error) {
      // eslint-disable-next-line no-console
      console.error(error);
    }

    const kmsAddress = await client.CallContractMethod({
      contractAddress: client.utils.HashToAddress(libraryId),
      abi: BaseLibraryContract.abi,
      methodName: "addressKMS"
    });
    const kmsId = `ikms${client.utils.AddressToHash(kmsAddress)}`;

    /* Types */
    const types = await Fabric.ListLibraryContentTypes({libraryId});

    return {
      ...libraryInfo,
      libraryId,
      types,
      name: privateMeta.name || libraryId,
      description: privateMeta["eluv.description"],
      contractAddress: FormatAddress(client.utils.HashToAddress(libraryId)),
      libraryObjectId: libraryId.replace("ilib", "iq__"),
      privateMeta,
      imageUrl,
      kmsId,
      owner,
      isOwner: EqualAddress(owner, currentAccountAddress),
      isContentSpaceLibrary: libraryId === Fabric.contentSpaceLibraryId
    };
  },

  ListLibraryContentTypes: async ({libraryId}) => {
    if(libraryId === Fabric.contentSpaceLibraryId) { return {}; }

    let types = await client.LibraryContentTypes({libraryId});
    await Promise.all(
      Object.values(types).map(async type => {
        types[type.id].appUrls = await Fabric.AppUrls({object: type});
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

  CreateContentLibrary: async ({name, description, publicMetadata, privateMetadata, kmsId}) => {
    return await client.CreateContentLibrary({
      name,
      description,
      //publicMetadata,
      //privateMetadata,
      metadata: {...(publicMetadata || {}), ...(privateMetadata || {})},
      kmsId
    });
  },

  DeleteContentLibrary: async ({libraryId}) => {
    await client.DeleteContentLibrary({libraryId});
  },

  SetContentLibraryImage: async ({libraryId, image}) =>{
    await client.SetContentLibraryImage({libraryId, image});
  },

  /* Library Groups */

  ListContentLibraryGroups: async ({libraryId, type, params}) => {
    return await Fabric.ListAccessGroups({params: {libraryId, type, ...params}});
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
    const filterOptions = {
      select: ["name", "eluv.description", "image", "description"],
      sort: "name",
      limit: params.perPage
    };

    if(params.page) {
      filterOptions.start = (params.page - 1) * params.perPage;
    }

    if(params.filter) {
      filterOptions.filter = {key: "name", type: "cnt", filter: params.filter};
    }

    if(params.cacheId) {
      filterOptions.cacheId = params.cacheId;
    }

    let {contents, paging} = await client.ContentObjects({libraryId, filterOptions});

    contents = contents || [];
    const count = paging.items;
    const cacheId = paging.cache_id;

    let objects = {};
    for(const object of contents) {
      try {
        //const owner = await Fabric.GetContentObjectOwner({objectId: object.id});

        const latestVersion = object.versions[0];

        const imageUrl = await Fabric.GetContentObjectImageUrl({
          libraryId,
          objectId: object.id,
          versionHash: latestVersion.hash,
          metadata: object.versions[0].meta
        });

        const accessInfo = await Fabric.GetAccessInfo({objectId: object.id});
        const meta = latestVersion.meta || {};
        objects[object.id] = {
          // Pull latest version info up to top level
          ...latestVersion,
          id: object.id,
          objectId: object.id,
          hash: object.hash,
          type: object.type,
          name: meta.name,
          description: meta["eluv.description"] || meta.description,
          accessInfo,
          imageUrl,
          contractAddress: client.utils.HashToAddress(object.id)
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
      cacheId,
      count
    };
  },

  GetContentObject: async ({libraryId, objectId}) => {
    const isContentLibraryObject = client.utils.EqualHash(libraryId, objectId);
    const isContentType = libraryId === Fabric.contentSpaceLibraryId && !isContentLibraryObject;
    const isNormalObject = !isContentLibraryObject && !isContentType;

    // Only normal objects have status and access charge
    let status, accessInfo;
    if(isNormalObject) {
      status = await Fabric.GetContentObjectStatus({objectId});
      accessInfo = await Fabric.GetAccessInfo({objectId});
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
      description: metadata["eluv.description"] || metadata.description,
      typeInfo,
      imageUrl,
      videoUrl,
      contractAddress: FormatAddress(client.utils.HashToAddress(objectId)),
      customContractAddress,
      owner,
      isOwner: EqualAddress(owner, await Fabric.CurrentAccountAddress()),
      accessInfo,
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
        //const verification = await Fabric.VerifyContentObject({libraryId, objectId, versionHash: version.hash});
        const parts = (await Fabric.ListParts({libraryId, objectId, versionHash: version.hash}));

        // Must keep versions in order from newest to oldest
        fullVersions[index] = {
          ...version,
          meta: metadata,
          verification: {},
          parts
        };
      })
    );

    return fullVersions;
  },

  GetContentObjectImageUrl: async ({libraryId, objectId, versionHash, metadata}) => {
    let imagePartHash;
    if(metadata) {
      imagePartHash = metadata.public && metadata.public.image || metadata.image;
    } else {
      imagePartHash =
        await client.ContentObjectMetadata({libraryId, objectId, versionHash, metadataSubtree: "public/image"}) ||
        await client.ContentObjectMetadata({libraryId, objectId, versionHash, metadataSubtree: "image"});
    }

    if(!imagePartHash) { return; }

    return await client.PublicRep({libraryId, objectId, versionHash, rep: "image"});
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

  GetAccessInfo: async ({objectId}) => {
    return await client.AccessInfo({objectId});
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
      name,
      metadata: {
        ...metadata,
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

  // List content types for display
  ListContentTypes: async ({params}) => {
    let contentTypes = Object.values(await client.ContentTypes());

    // Filter
    if(params.filter) {
      contentTypes = contentTypes.filter(contentType => {
        try {
          return (contentType.meta.name || "").toLowerCase().includes(params.filter.toLowerCase());
        } catch(e) {
          return false;
        }
      });
    }

    const count = contentTypes.length;

    // Sort
    contentTypes = contentTypes.sort((a, b) => {
      const name1 = a.meta.name|| "zz";
      const name2 = b.meta.name || "zz";
      return name1.toLowerCase() > name2.toLowerCase() ? 1 : -1;
    });

    // Paginate
    const page = params.page - 1;
    const perPage = params.perPage || 10;
    contentTypes = contentTypes.slice(page * perPage, (page+1) * perPage);

    let types = {};
    for(const type of contentTypes) {
      try {
        const owner = await Fabric.GetContentObjectOwner({objectId: type.id});

        types[type.id] = {
          ...type,
          name: type.meta.name || "",
          description: type.meta["eluv.description"] || type.meta.description,
          owner,
          isOwner: EqualAddress(owner, await Fabric.CurrentAccountAddress())
        };
      } catch(error) {
        /* eslint-disable no-console */
        console.error("Failed to list content type " + type.id);
        console.error(error);
        /* eslint-enable no-console */
      }
    }

    return {
      types,
      count
    };
  },

  // Get all content types for usage in forms, etc.
  ContentTypes: async () => {
    return await client.ContentTypes();
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

    await client.SetAccessCharge({objectId, accessCharge});
  },

  /* Files */

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

  DownloadPart: ({libraryId, objectId ,versionHash, partHash, format="blob", chunked=false, chunkSize=10000000, callback}) => {
    return client.DownloadPart({libraryId, objectId, versionHash, partHash, format, chunked, chunkSize, callback});
  },

  UploadPart: async ({libraryId, objectId, writeToken, file, chunkSize=1000000, encrypt=false, callback}) => {
    const encryption = encrypt ? "cgck" : "none";

    const partWriteToken = await client.CreatePart({libraryId, objectId, writeToken, encryption});

    if(callback) {
      callback({uploaded: 0, total: file.size});
    }

    const totalChunks = Math.ceil(file.size / chunkSize);
    for(let chunkNumber = 0; chunkNumber < totalChunks; chunkNumber++) {
      const from = chunkNumber * chunkSize;
      const to = Math.min(from + chunkSize, file.size);

      await client.UploadPartChunk({
        libraryId,
        objectId,
        writeToken,
        partWriteToken,
        chunk: await new Response(file.slice(from, to)).arrayBuffer(),
        encryption
      });

      if(callback) {
        callback({uploaded: to, total: file.size});
      }
    }

    return await client.FinalizePart({libraryId, objectId, writeToken, partWriteToken, encryption});
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

  GetBlockNumber: async () => {
    return await client.BlockNumber();
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

  SendFunds: ({recipient, ether}) => {
    return client.SendFunds({recipient, ether});
  },

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

  Contracts: async () => {
    const contracts = (await client.userProfileClient.UserMetadata({
      metadataSubtree: UrlJoin("elv-fabric-browser", "contracts"),
      requestor: APP_REQUESTOR_NAME
    })) || {};

    return {contracts, count: Object.keys(contracts).length};
  },

  DeployedContracts: async () => {
    const contracts = (await client.userProfileClient.UserMetadata({
      metadataSubtree: UrlJoin("elv-fabric-browser", "deployedContracts"),
      requestor: APP_REQUESTOR_NAME
    })) || {};

    return {contracts, count: Object.keys(contracts).length};
  },

  AddContract: async ({name, description, abi, bytecode}) => {
    await client.userProfileClient.MergeUserMetadata({
      metadataSubtree: UrlJoin("elv-fabric-browser", "contracts", name),
      metadata: {
        name,
        description,
        abi,
        bytecode
      },
      requestor: APP_REQUESTOR_NAME
    });
  },

  RemoveContract: async ({name}) => {
    await client.userProfileClient.DeleteUserMetadata({
      metadataSubtree: UrlJoin("elv-fabric-browser", "contracts", name),
      requestor: APP_REQUESTOR_NAME
    });
  },

  AddDeployedContract: async ({name, description, address, abi, bytecode, owner}) => {
    address = FormatAddress(address);

    await client.userProfileClient.MergeUserMetadata({
      metadataSubtree: UrlJoin("elv-fabric-browser", "deployedContracts", address),
      metadata: {
        name,
        description,
        address,
        abi,
        bytecode,
        owner
      },
      requestor: APP_REQUESTOR_NAME
    });
  },

  RemoveDeployedContract: async ({address}) => {
    await client.userProfileClient.DeleteUserMetadata({
      metadataSubtree: UrlJoin("elv-fabric-browser", "deployedContracts", address),
      requestor: APP_REQUESTOR_NAME
    });
  },

  async ListAccessGroups({params}) {
    let accessGroupAddresses;
    if(params.libraryId) {
      // Get library access groups of the specified type
      let numGroups = await client.CallContractMethod({
        contractAddress: client.utils.HashToAddress(params.libraryId),
        abi: BaseLibraryContract.abi,
        methodName: params.type + "GroupsLength"
      });

      numGroups = parseInt(numGroups._hex, 16);

      accessGroupAddresses = await Promise.all(
        [...Array(numGroups)].map(async (_, i) => {
          return Fabric.utils.FormatAddress(
            await client.CallContractMethod({
              contractAddress: client.utils.HashToAddress(params.libraryId),
              abi: BaseLibraryContract.abi,
              methodName: params.type + "Groups",
              methodArgs: [i]
            })
          );
        })
      );
    } else {
      // Get all access groups
      accessGroupAddresses = await client.Collection({collectionType: "accessGroups"});
    }

    let filteredAccessGroups = await Promise.all(
      accessGroupAddresses.map(async contractAddress => await Fabric.GetAccessGroup({contractAddress}))
    );

    // Filter
    if(params.filter) {
      filteredAccessGroups = filteredAccessGroups.filter(accessGroup => {
        try {
          return (
            accessGroup.name.toLowerCase().includes(params.filter.toLowerCase()) ||
            accessGroup.address.toLowerCase().includes(params.filter.toLowerCase())
          );
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
    let accessGroups = {};
    filteredAccessGroups.forEach(accessGroup => accessGroups[Fabric.utils.FormatAddress(accessGroup.address)] = accessGroup);

    return {accessGroups, count};
  },

  async GetAccessGroup({contractAddress}) {
    contractAddress = Fabric.utils.FormatAddress(contractAddress);
    const currentAccountAddress = await Fabric.CurrentAccountAddress();

    let owner, metadata;
    let isManager = false;

    try {
      owner = Fabric.utils.FormatAddress(
        await client.CallContractMethod({
          contractAddress,
          abi: BaseAccessGroupContract.abi,
          methodName: "owner"
        })
      );

      isManager = await client.CallContractMethod({
        contractAddress,
        abi: BaseAccessGroupContract.abi,
        methodName: "hasManagerAccess",
        methodArgs: [client.utils.FormatAddress(currentAccountAddress)]
      });

      metadata = await client.ContentObjectMetadata({
        libraryId: Fabric.contentSpaceLibraryId,
        objectId: client.utils.AddressToObjectId(contractAddress)
      });
    } catch(error) {
      // eslint-disable-next-line no-console
      console.error(error);
    }
    return {
      address: contractAddress,
      name: metadata.name || contractAddress,
      description: metadata.description,
      metadata,
      owner,
      isManager,
      isOwner: client.utils.EqualAddress(owner, currentAccountAddress)
    };
  },

  async ListAccessGroupMembers({contractAddress, showManagers=false, params}) {
    const memberAddresses = showManagers ?
      await client.AccessGroupManagers({contractAddress}) :
      await client.AccessGroupMembers({contractAddress});

    let members = await Promise.all(
      memberAddresses.map(async address => {
        const name = await client.userProfileClient.PublicUserMetadata({address, metadataSubtree: "name"});

        return {
          name: name || address,
          address
        };
      })
    );

    const currentAccountAddress = await Fabric.CurrentAccountAddress();

    let filteredMembers = Object.values(members);

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
          return (
            member.name.toLowerCase().includes(params.filter.toLowerCase()) ||
            member.address.toLowerCase().includes(params.filter.toLowerCase())
          );
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
    members = {};
    filteredMembers.forEach(member => members[member.address] = member);

    return {members, count};
  }
};

export default Fabric;
