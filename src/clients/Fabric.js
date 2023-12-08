import { FrameClient } from "@eluvio/elv-client-js/src/FrameClient";
import UrlJoin from "url-join";
import {EqualAddress, FormatAddress, LROStatus} from "../utils/Helpers";
const Fetch = typeof fetch !== "undefined" ? fetch : require("node-fetch").default;

let client = new FrameClient({
  target: window.parent,
  timeout: 240
});

let objectCache = {};

const Fabric = {
  /* Utils */
  client,
  currentAccountAddress: undefined,
  utils: client.utils,
  cachedImages: {},
  concurrencyLimit: 20,
  permissionLevels: client.permissionLevels,

  async Initialize() {
    window.client = client;

    this.contentSpaceId = await client.ContentSpaceId();
    this.contentSpaceLibraryId = this.contentSpaceId.replace("ispc", "ilib");
    this.contentSpaceId = this.contentSpaceId.replace("ispc", "iq__");
  },

  async ResetRegion() {
    await client.ResetRegion();
  },

  async ClearStaticToken() {
    await client.ClearStaticToken();
  },

  async SetFramePath({path}) {
    return await client.SendMessage({
      options: {
        operation: "SetFramePath",
        path
      }
    });
  },

  async ExecuteFrameRequest({request, Respond}) {
    Respond(await client.PassRequest({request, Respond}));
  },

  CurrentAccountAddress: async () => {
    if(!Fabric.currentAccountAddress) {
      Fabric.currentAccountAddress = FormatAddress(await client.CurrentAccountAddress());
    }

    return Fabric.currentAccountAddress;
  },

  DefaultKMSId: async () => {
    return `ikms${Fabric.utils.AddressToHash(await client.DefaultKMSAddress())}`;
  },

  DefaultTenantId: async () => {
    return await client.userProfileClient.TenantId();
  },

  /* Access Groups */

  CreateAccessGroup: async ({name, description, metadata={}}) => {
    return await client.CreateAccessGroup({name, description, metadata});
  },

  DeleteAccessGroup: async ({address}) => {
    return await client.DeleteAccessGroup({contractAddress: address});
  },

  async LeaveAccessGroup({contractAddress, manager=false, member=false}) {
    const currentAccountAddress = await Fabric.CurrentAccountAddress();

    if(manager) {
      try {
        await Fabric.RemoveAccessGroupManager({contractAddress, memberAddress: currentAccountAddress});
      // eslint-disable-next-line no-empty
      } catch(error) {
        throw Error("Failed to remove access group managership");
      }
    }

    if(member) {
      try {
        await Fabric.RemoveAccessGroupMember({contractAddress, memberAddress: currentAccountAddress});
      // eslint-disable-next-line no-empty
      } catch(error) {
        throw Error("Failed to remove access group membership");
      }
    }
  },

  async AddAccessGroupMember({contractAddress, memberAddress}) {
    try {
      return await client.AddAccessGroupMember({
        contractAddress,
        memberAddress: FormatAddress(memberAddress)
      });
    } catch(error) {
      throw Error("Failed to add access group membership");
    }
  },

  async RemoveAccessGroupMember({contractAddress, memberAddress}) {
    try {
      return await client.RemoveAccessGroupMember({
        contractAddress,
        memberAddress: FormatAddress(memberAddress)
      });
    } catch(error) {
      throw Error("Failed to remove access group membership");
    }
  },

  async AddAccessGroupManager({contractAddress, memberAddress}) {
    try {
      return await client.AddAccessGroupManager({
        contractAddress,
        memberAddress: FormatAddress(memberAddress)
      });
    } catch(error) {
      throw Error("Failed to add access group membership");
    }
  },

  async RemoveAccessGroupManager({contractAddress, memberAddress}) {
    try {
      return await client.RemoveAccessGroupManager({
        contractAddress,
        memberAddress: FormatAddress(memberAddress)
      });
    } catch(error) {
      throw Error("Failed to remove access group managership");
    }
  },

  async IsGroupMember({contractAddress, memberAddress}) {
    const walletAddress = await client.CallContractMethod({
      contractAddress: client.utils.HashToAddress(this.contentSpaceId),
      methodName: "userWallets",
      methodArgs: [memberAddress]
    });

    return await client.CallContractMethod({
      contractAddress: walletAddress,
      methodName: "checkRights",
      methodArgs: [
        2, // CATEGORY_GROUP = 2
        contractAddress,
        0 // TYPE_SEE = 0; TYPE_ACCESS = 1; TYPE_EDIT = 2
      ]
    });
  },

  async SetGroupVisibility({contractAddress, visibility}) {
    visibility = parseInt(visibility);
    return await this.CallContractMethodAndWait({
      contractAddress,
      methodName: "setVisibility",
      methodArgs: [visibility],
    });
  },

  /* Libraries */

  FilterContentLibraries(libraries, field, value, negate=false) {
    return libraries.filter(({meta}) => {
      try {
        const result = (meta.public[field] || "").toLowerCase().includes(value);
        return negate ? !result : result;
      } catch(e) {
        return false;
      }
    });
  },

  ListContentLibraries: async ({params}) => {
    const libraryIds = await client.ContentLibraries();
    let filteredLibraries = await libraryIds.limitedMap(
      Fabric.concurrencyLimit,
      async libraryId => {
        try {
          const contractAddress = Fabric.utils.HashToAddress(libraryId);
          const libraryObjectId = Fabric.utils.AddressToObjectId(contractAddress);

          // TODO: Find way to determine if contract has been killed
          // Call library contract to ensure library exists
          const publicMeta = (await client.ContentObjectMetadata({
            libraryId,
            objectId: libraryObjectId,
            metadataSubtree: "public"
          })) || {};

          return {
            libraryId,
            meta: {
              public: publicMeta
            }
          };
        } catch(error) {
          return {
            libraryId,
            meta: {
              public: {}
            }
          };
        }
      }
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
      a.meta = a.meta || { public: {} };
      b.meta = b.meta || { public: {} };
      const name1 = a.meta.public.name || "zz";
      const name2 = b.meta.public.name || "zz";
      return name1.toLowerCase() > name2.toLowerCase() ? 1 : -1;
    });

    const count = filteredLibraries.length;

    // Paginate libraries
    const page = (params.page || 1) - 1;
    const perPage = params.perPage || 10;
    filteredLibraries = filteredLibraries.slice(page * perPage, (page+1) * perPage);
    let libraries = {};

    await filteredLibraries.limitedMap(
      Fabric.concurrencyLimit,
      async ({libraryId, meta}) => {
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
            name: meta.public && meta.public.name || libraryId,
            description: (meta.public && meta.public.description) || meta.description,
            imageUrl,
            isContentSpaceLibrary: libraryId === Fabric.contentSpaceLibraryId
          };
        } catch(error) {
          /* eslint-disable no-console */
          console.error(`Failed to get content library ${meta.name || libraryId}: `);
          console.error(error);
          /* eslint-enable no-console */
        }
      }
    );

    return {
      libraries,
      count
    };
  },

  GetContentLibrary: async ({libraryId}) => {
    const objectId = client.utils.AddressToObjectId(client.utils.HashToAddress(libraryId));

    if(Fabric.client.utils.EqualHash(objectId, Fabric.contentSpaceId)) {
      // This is the content space, which may not be initialized
      return {
        libraryId,
        types: {},
        name: "Content Space",
        contractAddress: FormatAddress(client.utils.HashToAddress(libraryId)),
        libraryObjectId: objectId,
        privateMeta: {},
        publicMeta: {},
        isContentSpaceLibrary: true
      };
    }

    const latestVersionHash = await client.LatestVersionHash({objectId});

    /* Library object and private metadata */

    let privateMeta = {};
    let publicMeta = {};
    try {
      privateMeta = await Fabric.GetContentObjectMetadata({
        libraryId,
        objectId
      });

      publicMeta = {...(privateMeta.public || {})};
      delete privateMeta.public;
    } catch(error) {
      // eslint-disable-next-line no-console
      console.error(error);
    }

    /* Library */
    let [
      libraryInfo,
      types,
      imageUrl,
      kmsAddress,
      tenantId
    ] = await Promise.all([
      client.ContentLibrary({libraryId}), // libraryInfo
      Fabric.ListLibraryContentTypes({libraryId}), // types
      Fabric.GetContentObjectImageUrl({ // imageUrl
        libraryId,
        objectId,
        versionHash: latestVersionHash,
        metadata: { public: publicMeta }
      }),
      client.CallContractMethod({ // kmsAdress
        contractAddress: client.utils.HashToAddress(libraryId),
        methodName: "addressKMS"
      }),
      client.CallContractMethod({ // tenantId
        contractAddress: client.utils.HashToAddress(libraryId),
        methodName: "getMeta",
        methodArgs: [
          "_tenantId"
        ]
      })
    ]);

    const kmsId = kmsAddress ? `ikms${client.utils.AddressToHash(kmsAddress)}` : "";

    tenantId = tenantId ? Buffer.from(tenantId.replace("0x", ""), "hex").toString("utf-8") : "";


    // Owner name not available
    let ownerName;
    /*
    try {
      ownerName = await client.userProfileClient.PublicUserMetadata({
        address: owner,
        metadataSubtree: "name"
      });
    // eslint-disable-next-line no-empty
    } catch(error) {}

     */

    return {
      ...libraryInfo,
      libraryId,
      types,
      name: publicMeta.name || privateMeta.name || libraryId,
      description: publicMeta.description || privateMeta.description,
      contractAddress: FormatAddress(client.utils.HashToAddress(libraryId)),
      libraryObjectId: libraryId.replace("ilib", "iq__"),
      privateMeta,
      publicMeta,
      imageUrl,
      kmsId,
      tenantId,
      ownerName,
      isContentSpaceLibrary: libraryId === Fabric.contentSpaceLibraryId
    };
  },

  ContentLibraryUserPermissions: async ({libraryId, isContentSpaceLibrary}) => {
    let canContribute = false, isManager = false;
    const currentAccountAddress = await Fabric.CurrentAccountAddress();
    const owner = await Fabric.GetContentLibraryOwner({libraryId});
    const isOwner = EqualAddress(owner, currentAccountAddress);

    if(!isContentSpaceLibrary) {
      // Determine if current user can contribute to the library

      const [contributorGroups, userGroups] = await Promise.all([
        Fabric.LibraryGroupAddresses({libraryId, type: "contributor"}),
        Fabric.AccessGroupAddresses()
      ]);

      const contractAddress = client.utils.HashToAddress(libraryId);
      const canContributeResponse = await client.CallContractMethod({
        contractAddress,
        methodName: "canContribute",
        methodArgs: [
          FormatAddress(currentAccountAddress)
        ]
      });

      canContribute = (
        isOwner ||
        (contributorGroups.filter(address => userGroups.includes(address))).length > 0 ||
        canContributeResponse
      );
    }

    try {
      isManager = await client.CallContractMethod({
        contractAddress: client.utils.HashToAddress(libraryId),
        methodName: "canEdit",
      });
    } catch(error) {
      // eslint-disable-next-line no-console
      console.error(`Unable to call canEdit on ${libraryId}`);
    }

    return {
      canContribute,
      owner,
      isOwner,
      isManager,
    };
  },

  ListLibraryContentTypes: async ({libraryId}) => {
    if(libraryId === Fabric.contentSpaceLibraryId) { return {}; }

    let types = await client.LibraryContentTypes({libraryId});
    await Object.values(types).limitedMap(
      Fabric.concurrencyLimit,
      async type => {
        types[type.id] = {
          ...types[type.id],
          ...(await Fabric.AppUrls({object: type}))
        };
      }
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
    return FormatAddress(await client.ContentLibraryOwner({libraryId}));
  },

  CreateContentLibrary: async ({name, description, publicMetadata={}, privateMetadata={}, kmsId, tenantId}) => {
    return await client.CreateContentLibrary({
      name,
      description,
      metadata: {
        ...privateMetadata,
        public: publicMetadata
      },
      kmsId,
      tenantId
    });
  },

  DeleteContentLibrary: async ({libraryId}) => {
    await client.DeleteContentLibrary({libraryId});
  },

  SetContentLibraryImage: async ({libraryId, writeToken, image, imageName}) =>{
    await client.SetContentLibraryImage({libraryId, writeToken, image, imageName});
  },

  /* Library Groups */

  ListContentLibraryGroups: async ({libraryId, type, params={}}) => {
    if(["accessor", "contributor"].includes(type)) {
      return Fabric.ListAccessGroups({params: {libraryId, type, ...params}});
    } else if(type === "manage") {
      const accessGroups = {};
      const accessGroupList = await Fabric.ListContentLibraryManagerGroups({libraryId});

      for(let i = 0; i < accessGroupList.length; i++) {
        const address = accessGroupList[i];
        accessGroups[address] = await Fabric.GetAccessGroup({contractAddress: address, publicOnly: false});
      }

      return {
        accessGroups,
        count: accessGroupList.length
      };
    }
  },

  ListContentLibraryManagerGroups: async ({libraryId}) => {
    const groups = await client.ContentObjectGroupPermissions({objectId: libraryId.replace("ilib", "iq__")});
    const filteredGroups = [];

    for(let i = 0; i < Object.keys(groups).length; i++) {
      const address = Object.keys(groups)[i];
      const group = groups[address] || [];

      if(group.includes("manage")) {
        filteredGroups.push(address);
      }
    }

    return filteredGroups;
  },

  AddContentLibraryGroup: async ({libraryId, address, groupType}) => {
    const event = await client.CallContractMethodAndWait({
      contractAddress: client.utils.HashToAddress(libraryId),
      methodName: "add" + groupType.capitalize() + "Group",
      methodArgs: [FormatAddress(address)]
    });

    if(!event.logs || event.logs.length === 0) {
      throw Error("Failed to add " + groupType + "group " + address);
    }
  },

  AddContentLibraryManagerGroup: async ({libraryId, address}) => {
    await client.AddContentObjectGroupPermission({
      objectId: libraryId.replace("ilib", "iq__"),
      groupAddress: address,
      permission: "manage"
    });
  },

  RemoveContentLibraryManagerGroup: async ({libraryId, address}) => {
    await client.RemoveContentObjectGroupPermission({
      objectId: libraryId.replace("ilib", "iq__"),
      groupAddress: address,
      permission: "manage"
    });
  },

  SetContentLibraryRights: async ({libraryId, address, type="SEE", access}) => {
    // access - 1 add | 0 revoke
    const typeMap = {
      "SEE": 0,
      "ACCESS": 1,
      "EDIT": 2
    };
    const accessType = typeMap[type];

    await client.CallContractMethodAndWait({
      contractAddress: client.utils.HashToAddress(libraryId),
      methodName: "setRights",
      methodArgs: [
        FormatAddress(address),
        accessType,
        access
      ]
    });
  },

  RemoveContentLibraryGroup: async ({libraryId, address, groupType}) => {
    const event = await client.CallContractMethodAndWait({
      contractAddress: client.utils.HashToAddress(libraryId),
      methodName: "remove" + groupType.capitalize() + "Group",
      methodArgs: [FormatAddress(address)]
    });

    if(!event.logs || event.logs.length === 0) {
      throw Error("Failed to add " + groupType + "group " + address);
    }
  },

  /* Objects */

  LatestVersionHash: async ({objectId, versionHash}) => {
    return await client.LatestVersionHash({
      objectId,
      versionHash
    });
  },

  LookupContent: async (contentId) => {
    contentId = contentId.replace(/ /g, "");

    if(!contentId) { return; }

    try {
      let libraryId, objectId, accessType;
      if(contentId.startsWith("ilib")) {
        libraryId = contentId;
        accessType = "library";
      } else if(contentId.startsWith("hq__")) {
        objectId = Fabric.utils.DecodeVersionHash(contentId).objectId;
      } else if(contentId.startsWith("iq__")) {
        objectId = contentId;
      } else if(contentId.startsWith("0x")) {
        const id = Fabric.utils.AddressToObjectId(contentId);
        accessType = await Fabric.AccessType({id});

        if(accessType === "library") {
          libraryId = Fabric.utils.AddressToLibraryId(contentId);
        } else {
          objectId = id;
        }
      } else {
        objectId = Fabric.utils.AddressToObjectId(Fabric.utils.HashToAddress(contentId));
      }

      if(objectId && !libraryId) {
        libraryId = await Fabric.ContentObjectLibraryId({objectId});
      }

      if(!accessType) {
        accessType = await Fabric.AccessType({id: objectId});
      }

      switch(accessType) {
        case "library":
          if(objectId) {
            return { path: `/content/${libraryId}/${objectId}` };
          } else {
            return { path: `/content/${libraryId}` };
          }

        case "group":
          return { path: `/access-groups/${Fabric.utils.HashToAddress(objectId)}` };

        case "type":
          return { path: `/content-types/${objectId}` };

        default:
          return { path: `/content/${libraryId}/${objectId}` };
      }
    } catch(error) {
      // eslint-disable-next-line no-console
      console.error("Failed to look up ID:");
      // eslint-disable-next-line no-console
      console.error(error);

      return { error: "Invalid content ID" };
    }
  },

  ContentObjectLibraryId: async ({objectId, versionHash}) => {
    return await client.ContentObjectLibraryId({objectId, versionHash});
  },

  AccessType: async ({id}) => {
    return await client.AccessType({id});
  },

  IsNormalObject: async ({objectId}) => {
    return (await client.AccessType({id: objectId})) === "object";
  },

  // Make sure not to call anything requiring content object authorization
  ListContentObjects: async ({libraryId, params}) => {
    const filterOptions = {
      select: ["name", "image", "description", "public/name", "public/description", "public/image"],
      sort: "/public/name",
      limit: params.perPage
    };

    if(params.page) {
      filterOptions.start = (params.page - 1) * params.perPage;
    }

    if(params.filter) {
      filterOptions.filter = {key: "/public/name", type: "cnt", filter: params.filter};
    }

    if(params.cacheId) {
      filterOptions.cacheId = params.cacheId;
    }

    let {contents, paging} = await client.ContentObjects({libraryId, filterOptions});

    contents = contents || [];
    const count = paging.items;
    const cacheId = paging.cache_id;

    let objects = {};

    await client.utils.LimitedMap(
      Fabric.concurrencyLimit,
      contents,
      async object => {
        try {
          //const owner = await Fabric.GetContentObjectOwner({objectId: object.id});

          const latestVersion = object.versions[0];

          let imageUrl;
          try {
            imageUrl = await Fabric.GetContentObjectImageUrl({
              libraryId,
              objectId: object.id,
              versionHash: latestVersion.hash,
              metadata: object.versions[0].meta
            });
          } catch(error) {
            /* eslint-disable no-console */
            console.error("Failed to check for display image for" + object.id);
            console.error(error);
            /* eslint-enable no-console */
          }

          const accessInfo = await Fabric.GetAccessInfo({objectId: object.id});
          const meta = latestVersion.meta || {};
          const publicMeta = meta.public || {};
          objects[object.id] = {
            // Pull latest version info up to top level
            ...latestVersion,
            id: object.id,
            objectId: object.id,
            hash: object.hash,
            type: object.type,
            name: (publicMeta.name || meta.name || "").toString(),
            description: publicMeta.description || meta.description,
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
    );

    return {
      objects,
      cacheId,
      count
    };
  },

  GetContentObject: async ({libraryId, objectId, refresh=false}) => {
    if(!libraryId) {
      libraryId = await client.ContentObjectLibraryId({objectId});
    }

    const isContentLibraryObject = client.utils.EqualHash(libraryId, objectId);
    const isContentType = libraryId === Fabric.contentSpaceLibraryId && !isContentLibraryObject;
    const isNormalObject = !isContentLibraryObject && !isContentType;
    const {isV3} = await client.ContractInfo({id: objectId});

    const latestVersionHash = await client.LatestVersionHash({objectId});

    // Cachable
    if(!objectCache[latestVersionHash] || refresh) {
      let [object, metadata] = await Promise.all([
        client.ContentObject({libraryId, objectId}),
        client.ContentObjectMetadata({libraryId, objectId})
      ]);

      if(!metadata) { metadata = {}; }
      if(!metadata.public) { metadata.public = {}; }

      objectCache[latestVersionHash] = {
        ...object,
        meta: metadata
      };
    }

    // Derived from cachable
    const object = objectCache[latestVersionHash];

    let permission;
    if(isNormalObject) {
      permission = await client.Permission({objectId, clearCache: true});
    }

    const {owner, isOwner, canEdit} = await Fabric.GetContentObjectUserPermissions({objectId});

    const walletAddress = await client.CallContractMethod({
      contractAddress: client.utils.HashToAddress(Fabric.contentSpaceId),
      methodName: "userWallets",
      methodArgs: [Fabric.currentAccountAddress]
    });


    let hasContentTypeAccess = false;
    if(object.type) {
      hasContentTypeAccess = await client.CallContractMethod({
        contractAddress: walletAddress,
        methodName: "checkRights",
        methodArgs: [
          4, // CATEGORY_CONTENT_TYPE = 4
          client.utils.HashToAddress(Fabric.utils.DecodeVersionHash(object.type).objectId),
          1 // TYPE_SEE = 0; TYPE_ACCESS = 1; TYPE_EDIT = 2
        ]
      });
    }

    let typeInfo;
    if(object.type) {
      typeInfo = await Fabric.GetContentType({
        versionHash: object.type,
        publicOnly: (!canEdit && permission === "public" || !hasContentTypeAccess)
      });
      typeInfo.latestTypeHash = typeInfo.latestType ? typeInfo.latestType.hash : "";
    }

    let name = object.meta.public.name || object.meta.name || object.id;
    if(typeof name !== "string") {
      name = object.id;
    }

    // Collect network requests to parallelize

    let tasks = [
      client.AccessType({id: objectId}), // accessType
      Fabric.GetContentObjectImageUrl({ // imageUrl
        libraryId,
        objectId,
        versionHash: object.hash,
        metadata: object.meta
      }),
      Fabric.AppUrls({ // appUrls
        object: {
          id: object.id,
          hash: object.hash,
          meta: object.meta
        }
      }),
      Fabric.FileUrl({ // baseFileUrl
        libraryId,
        objectId,
        filePath: "/"
      }),
      client.Visibility({id: objectId}), // visibility
      Fabric.GetCustomContentContractAddress({ // customContractAddress
        libraryId,
        objectId,
        metadata: object.meta
      }),
      client.CallContractMethod({ // Version count
        contractAddress: client.utils.HashToAddress(objectId),
        methodName: "countVersionHashes"
      })
    ];

    if(isNormalObject) {
      // Only normal objects have status and access charge
      tasks = tasks.concat([
        Fabric.GetAccessInfo({objectId}), // accessInfo
        client.CallContractMethod({ // kmsAddress
          contractAddress: client.utils.HashToAddress(objectId),
          methodName: "addressKMS"
        })
      ]);
    }

    let [
      accessType,
      imageUrl,
      appUrls,
      baseFileUrl,
      visibility,
      customContractAddress,
      versionCount,
      accessInfo,
      kmsAddress,
    ] = await Promise.all(tasks);

    versionCount = versionCount ? parseInt(versionCount._hex, 16) : 0;

    const kmsId = kmsAddress ? `ikms${client.utils.AddressToHash(kmsAddress)}` : undefined;

    // Non-cacheable (contract / LRO status)
    const lroStatus = await LROStatus({
      client,
      libraryId,
      objectId,
      metadata: object.meta
    });

    // Not able to get owner name
    let ownerName;
    /*
    try {
      ownerName = await client.userProfileClient.PublicUserMetadata({
        address: owner,
        metadataSubtree: "name"
      });
    // eslint-disable-next-line no-empty
    } catch(error) {}

     */

    return {
      ...object,
      ...appUrls,
      versionCount,
      writeToken: "",
      name,
      description: object.meta.public.description || object.meta.description,
      baseFileUrl,
      typeInfo,
      imageUrl,
      lroStatus,
      contractAddress: FormatAddress(client.utils.HashToAddress(objectId)),
      kmsId,
      customContractAddress,
      visibility,
      owner,
      ownerName,
      isOwner,
      canEdit,
      accessInfo,
      status,
      permission,
      isContentLibraryObject,
      isContentType,
      isNormalObject,
      accessType,
      isV3
    };
  },

  GetContentObjectUserPermissions: async({objectId, isContentType, isNormalObject}) => {
    const owner = await Fabric.GetContentObjectOwner({objectId: objectId});
    const isOwner = EqualAddress(owner, await Fabric.CurrentAccountAddress());

    let canEdit = isOwner;
    try {
      if(!canEdit && isNormalObject) {
        canEdit = await client.CallContractMethod({
          contractAddress: client.utils.HashToAddress(objectId),
          methodName: "canEdit"
        });
      } else if(!canEdit && isContentType) {
        canEdit = await client.CallContractMethod({
          contractAddress: client.utils.HashToAddress(objectId),
          methodName: "canCommit"
        });
      }
    } catch(error) {
      // eslint-disable-next-line no-console
      console.error(`Unable to call canEdit/canCommit on ${objectId}`);
    }

    return {
      owner,
      isOwner,
      canEdit
    };
  },

  GetContentObjectMetadata: async ({
    libraryId,
    objectId,
    versionHash,
    writeToken,
    metadataSubtree="/",
    service="default"
  }) => {
    return await client.ContentObjectMetadata({
      libraryId,
      objectId,
      versionHash,
      writeToken,
      metadataSubtree,
      service
    });
  },

  // Get all versions of the specified content object, along with metadata,
  // parts with proofs, and verification
  GetContentObjectVersions: async({libraryId, objectId}) => {
    return (await client.ContentObjectVersions({libraryId, objectId})).versions
      .map((version, i) => {
        // Clean up object cache if necessary - only latest version is used
        if(i !== 0 && version.hash in objectCache) {
          delete objectCache[version.hash];
        }

        return version.hash;
      });
  },

  // Get all versions of the specified content object, along with metadata,
  // parts with proofs, and verification
  GetContentObjectVersion: async ({versionHash}) => {
    const version = await client.ContentObject({versionHash});
    const metadata = await Fabric.GetContentObjectMetadata({versionHash});
    //const verification = await Fabric.VerifyContentObject({libraryId, objectId, versionHash: version.hash});

    let typeInfo = {};
    if(version.type) {
      typeInfo = await Fabric.GetContentType({versionHash: version.type});
      typeInfo.latestTypeHash = typeInfo.latestType ? typeInfo.latestType.hash : "";
    }

    return {
      ...version,
      typeInfo,
      meta: metadata,
      verification: {}
    };
  },

  GetContentObjectImageUrl: async ({libraryId, objectId, versionHash, metadata}) => {
    try {
      const fileImageUrl = await client.ContentObjectImageUrl({
        libraryId,
        objectId,
        versionHash
      });

      if(fileImageUrl) {
        return fileImageUrl;
      }

      if(!Fabric.cachedImages[objectId]) {
        let imagePartHash;

        if(metadata) {
          imagePartHash = (metadata.public && metadata.public.image) || metadata.image;
        } else {
          imagePartHash =
            await client.ContentObjectMetadata({libraryId, objectId, versionHash, metadataSubtree: "public/image"});
        }

        if(imagePartHash) {
          Fabric.cachedImages[objectId] = await client.PublicRep({libraryId, objectId, versionHash, rep: "image"});
        }
      }

      return Fabric.cachedImages[objectId];
    } catch(error) {
      // eslint-disable-next-line no-console
      console.error("Failed to load image for", libraryId || "", objectId || "", versionHash || "");
      // eslint-disable-next-line no-console
      console.error(error);
    }
  },

  GetContentObjectGroupPermissions: async ({objectId}) => {
    const permissions = await client.ContentObjectGroupPermissions({objectId});

    let permissionInfo = {};
    await Promise.all(
      Object.keys(permissions).map(async contractAddress => {
        permissionInfo[contractAddress] = {
          ...(await Fabric.GetAccessGroup({contractAddress, publicOnly: true})),
          address: contractAddress,
          permissions: permissions[contractAddress]
        };
      })
    );

    return permissionInfo;
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

    const creationCall = await client.CreateContentObject({
      libraryId: libraryId,
      options: requestParams
    });

    await client.SetVisibility({
      id: creationCall.id,
      visibility: 0
    });

    return creationCall;
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
    options={},
    service="default"
  }) => {
    return await client.EditContentObject({
      libraryId,
      objectId,
      options,
      service
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
    metadata,
    service="default"
  }) => {
    await client.ReplaceMetadata({
      libraryId,
      objectId,
      writeToken,
      metadataSubtree,
      metadata,
      service
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

  CopyContentObject: async({
    libraryId,
    originalVersionHash,
    options={}
  }) => {
    const response = await client.CopyContentObject({
      libraryId,
      originalVersionHash,
      options
    });

    return response;
  },

  FinalizeContentObject: async ({
    libraryId,
    objectId,
    writeToken,
    commitMessage,
    awaitCommitConfirmation=true,
    service="default"
  }) => {
    delete Fabric.cachedImages[objectId];

    return await client.FinalizeContentObject({
      libraryId,
      objectId,
      writeToken,
      commitMessage,
      awaitCommitConfirmation,
      service
    });
  },

  EditAndFinalizeContentObject: async({
    libraryId,
    objectId,
    todo,
    commitMessage,
    awaitCommitConfirmation=true
  }) => {
    const editResponse = await Fabric.EditContentObject({libraryId, objectId});
    await todo(editResponse.write_token);

    await Fabric.FinalizeContentObject({
      libraryId,
      objectId,
      writeToken: editResponse.write_token,
      commitMessage,
      awaitCommitConfirmation
    });
  },

  FinalizeABRMezzanine: async ({libraryId, objectId}) => {
    await client.FinalizeABRMezzanine({libraryId, objectId});
  },

  AddContentObjectGroupPermission: async ({objectId, groupAddress, permission}) => {
    await client.AddContentObjectGroupPermission({objectId, groupAddress, permission});
  },

  RemoveContentObjectGroupPermission: async ({objectId, groupAddress, permission}) => {
    await client.RemoveContentObjectGroupPermission({objectId, groupAddress, permission});
  },

  SetContentObjectImage: async ({libraryId, objectId, writeToken, image, imageName}) => {
    await client.SetContentObjectImage({libraryId, objectId, writeToken, image, imageName});
  },

  SetPermission: async ({objectId, permission}) => {
    await client.SetPermission({objectId, permission});
  },

  /* Content Types */

  CreateContentType: async ({name, description, metadata={}, bitcode}) => {
    return await client.CreateContentType({
      name,
      metadata: {
        ...metadata,
        description,
        public: {
          ...(metadata.public || {}),
          name,
          description
        },
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
      const app = (object.meta.public || {})[`eluv.${appName}App`] || object.meta[`eluv.${appName}App`];

      if(!app) { continue; }

      if(app === "default") {
        let appUrl = EluvioConfiguration[`${appName}AppUrl`];
        if(!appUrl && EluvioConfiguration["fabricBrowserApps"]) {
          appUrl = appName === "display" ?
            EluvioConfiguration["fabricBrowserApps"]["stream-sample"] :
            EluvioConfiguration["fabricBrowserApps"]["asset-manager"];
        }

        appUrls[`${appName}AppUrl`] = appUrl;
      } else if((EluvioConfiguration["fabricBrowserApps"] || {})[app]) {
        // Fabric browser app from config
        appUrls[`${appName}AppUrl`] = EluvioConfiguration["fabricBrowserApps"][app];
      } else if(typeof app === "string" && (app.startsWith("http://") || app.startsWith("https://"))) {
        // App specification is a url
        appUrls[`${appName}AppUrl`] = app;
      } else if(app) {
        appUrls[`${appName}AppUrl`] = await Fabric.FileUrl({
          libraryId: Fabric.contentSpaceLibraryId,
          objectId: object.id,
          filePath: app
        });
      }
    }

    return appUrls;
  },

  // List content types for display
  ListContentTypes: async ({params}) => {
    const typesResponse = await client.ContentTypes();
    let contentTypes = Object.values(typesResponse);

    const GetName = contentType => (contentType.meta.public ? contentType.meta.public.name : contentType.meta.name) || "";

    // Filter
    if(params.filter) {
      contentTypes = contentTypes.filter(contentType => {
        try {
          return GetName(contentType).toLowerCase().includes(params.filter.toLowerCase());
        } catch(e) {
          return false;
        }
      });
    }

    const count = contentTypes.length;

    // Sort
    contentTypes = contentTypes.sort((a, b) => {
      const name1 = GetName(a) || "zz";
      const name2 = GetName(b) || "zz";
      return name1.toLowerCase() > name2.toLowerCase() ? 1 : -1;
    });

    // Paginate
    const page = params.page - 1 || 0;
    const perPage = params.perPage || 10;
    contentTypes = contentTypes.slice(page * perPage, (page+1) * perPage);

    let types = {};

    await contentTypes.limitedMap(
      Fabric.concurrencyLimit,
      async type => {
        try {
          const appUrls = await Fabric.AppUrls({object: type});

          types[type.id] = {
            ...type,
            ...appUrls,
            name: GetName(type),
            description: type.meta.public ? type.meta.public.description || type.meta.description : type.meta.description
          };
        } catch(error) {
          /* eslint-disable no-console */
          console.error("Failed to list content type " + type.id);
          console.error(error);
          /* eslint-enable no-console */
        }
      }
    );

    return {
      types,
      count
    };
  },

  GetContentType: async ({versionHash, publicOnly=false}) => {
    if(!versionHash) { return; }

    const latestVersionHash = await client.LatestVersionHash({versionHash});

    const GetType = async ({versionHash}) => {
      if(!objectCache[versionHash]) {
        objectCache[versionHash] = await client.ContentType({versionHash, publicOnly});
      }

      return objectCache[versionHash];
    };

    let [type, latestType] = await Promise.all([
      GetType({versionHash}),
      latestVersionHash === versionHash ?
        undefined :
        GetType({versionHash: latestVersionHash})
    ]);

    latestType = latestType || type;

    const appUrls = await Fabric.AppUrls({object: latestType});

    return {
      ...type,
      ...appUrls,
      latestType
    };
  },

  CreateNonOwnerCap: async ({libraryId, objectId, publicKey, label}) => {
    const {writeToken} = await Fabric.EditContentObject({libraryId, objectId});

    if(publicKey.startsWith("kupk")) {
      publicKey = client.utils.HashToAddress(publicKey.replace("kupk", ""), true);
    }

    const publicAddress = client.utils.PublicKeyToAddress(publicKey);

    await client.CreateNonOwnerCap({
      libraryId,
      objectId,
      publicKey,
      writeToken
    });

    const metadata = await Fabric.GetContentObjectMetadata({
      libraryId,
      objectId,
      metadataSubtree: "/owner_caps"
    });

    if(metadata) {
      await client.ReplaceMetadata({
        libraryId,
        objectId,
        writeToken,
        metadataSubtree: "/owner_caps",
        metadata: Object.assign(metadata, {[publicAddress]: label})
      });
    } else {
      await Fabric.MergeMetadata({
        libraryId,
        objectId,
        writeToken,
        metadataSubtree: "/owner_caps",
        metadata: {[publicAddress]: label}
      });
    }

    return await client.FinalizeContentObject({
      libraryId,
      objectId,
      writeToken,
      commitMessage: "Create non-owner cap"
    });
  },

  /* Contract calls */

  GetContentLibraryPermissions: async ({libraryId}) => {
    const currentAccountAddress = await client.CurrentAccountAddress();

    const canContribute = await Fabric.CallContractMethod({
      contractAddress: client.utils.HashToAddress(libraryId),
      methodName: "canContribute",
      methodArgs: [currentAccountAddress]
    });

    const canReview = await Fabric.CallContractMethod({
      contractAddress: client.utils.HashToAddress(libraryId),
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

  PublishContentObject: async ({objectId}) => {
    await client.CallContractMethodAndWait({
      contractAddress: client.utils.HashToAddress(objectId),
      methodName: "publish",
      methodArgs: []
    });
  },

  ReviewContentObject: async ({libraryId, objectId, approve, note}) => {
    await client.CallContractMethodAndWait({
      contractAddress: client.utils.HashToAddress(libraryId),
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
      methodName: "accessCharge",
    });
    currentAccessCharge = parseInt(currentAccessCharge._hex, 16);

    const accessChargeWei = Fabric.utils.EtherToWei(accessCharge);

    // Access charge is the same, no need to update
    if(accessChargeWei.isEqualTo(currentAccessCharge)) { return; }

    await client.SetAccessCharge({objectId, accessCharge});
  },

  SearchV1: async() => {
    const configUrl = await client.ConfigUrl();
    const response = await client.utils.ResponseToJson(await Fetch(configUrl));

    if(
      response &&
      response.network &&
      response.network.services &&
      response.network.services.search
    ) {
      return response.network.services.search;
    } else {
      return [];
    }
  },

  SearchV2: async () => {
    const configUrl = await client.ConfigUrl();
    const response = await client.utils.ResponseToJson(await Fetch(configUrl));

    if(
      response &&
      response.network &&
      response.network.services &&
      response.network.services.search_v2
    ) {
      return response.network.services.search_v2;
    } else {
      return [];
    }
  },

  /* Files */

  UploadFiles: async ({libraryId, objectId, writeToken, fileInfo, encrypt, callback}) => {
    return await client.UploadFiles({
      libraryId,
      objectId,
      writeToken,
      fileInfo,
      encryption: encrypt ? "cgck" : "none",
      callback
    });
  },

  CreateDirectory: async ({libraryId, objectId, writeToken, directory}) => {
    return await client.CreateFileDirectories({
      libraryId,
      objectId,
      writeToken,
      filePaths: [directory]
    });
  },

  DeleteFiles: async ({libraryId, objectId, writeToken, filePaths}) => {
    return await client.DeleteFiles({libraryId, objectId, writeToken, filePaths});
  },

  DownloadFile: async ({libraryId, objectId, versionHash, writeToken, filePath, format="arrayBuffer", clientSideDecryption, callback}) => {
    const object = await client.ContentObject({libraryId, objectId});

    const kmsAddress = await client.CallContractMethod({
      contractAddress: client.utils.HashToAddress(objectId),
      methodName: "addressKMS"
    });

    const kmsId = kmsAddress && `ikms${client.utils.AddressToHash(kmsAddress)}`;

    let hasKmsConk = false;
    if(kmsId) {
      hasKmsConk = !!(await client.ContentObjectMetadata({
        libraryId: await client.ContentObjectLibraryId({objectId}),
        objectId,
        metadataSubtree: `eluv.caps.${kmsId}`
      }));
    }

    return await client.DownloadFile({
      libraryId,
      objectId,
      versionHash,
      writeToken,
      filePath,
      format,
      clientSideDecryption: !hasKmsConk || !object.type || clientSideDecryption,
      callback
    });
  },

  FileUrl: ({libraryId, objectId, versionHash, writeToken, filePath}) => {
    return client.FileUrl({libraryId, objectId, versionHash, writeToken, filePath});
  },

  /* Parts */

  ListParts: async ({libraryId, objectId, versionHash}) => {
    try {
      return await client.ContentParts({libraryId, objectId, versionHash});
    } catch(error) {
      // eslint-disable-next-line no-console
      console.error("Failed to get content parts for ", libraryId, objectId, versionHash);
      // eslint-disable-next-line no-console
      console.error(error);
      return [];
    }
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

    let lastUpload;
    let uploaded = 0;
    const totalChunks = Math.ceil(file.size / chunkSize);
    for(let chunkNumber = 0; chunkNumber < totalChunks; chunkNumber++) {
      const from = chunkNumber * chunkSize;
      const to = Math.min(from + chunkSize, file.size);

      // Encrypt next chunk (if necessary) while previous chunk is in flight
      let chunk = await new Response(file.slice(from, to)).arrayBuffer();
      if(encrypt) {
        chunk = await client.Encrypt({libraryId, objectId, writeToken, chunk});
      }

      if(lastUpload) {
        await lastUpload;

        if(callback) {
          callback({uploaded, total: file.size});
        }
      }

      lastUpload = client.UploadPartChunk({
        libraryId,
        objectId,
        writeToken,
        partWriteToken,
        chunk,
        encryption: "none"
      });

      uploaded = to;
    }

    await lastUpload;

    if(callback) {
      callback({uploaded, total: file.size});
    }

    return await client.FinalizePart({libraryId, objectId, writeToken, partWriteToken, encryption});
  },

  FabricUrl: ({libraryId, objectId, versionHash, partHash}) => {
    return client.FabricUrl({libraryId, objectId, versionHash, partHash});
  },

  /* Contracts */

  async ContractAbi({contractAddress, id}) {
    return await client.ContractAbi({contractAddress, id});
  },

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

  FormatEvents: async (events) => {
    let accountNames = {};

    // Get all from accounts in list of events
    let accounts = [];
    events.forEach(eventList => {
      eventList.forEach(event => {
        const from = Fabric.utils.FormatAddress(event.from);

        if(!accounts.includes(from)) {
          accounts.push(from);
        }

        if(event.to) {
          const to = Fabric.utils.FormatAddress(event.to);

          if(!accounts.includes(to)) {
            accounts.push(to);
          }
        }
      });
    });

    // Retrieve names for all addresses
    await accounts.limitedMap(
      Fabric.concurrencyLimit,
      async address => {
        try {
          accountNames[address] = await client.userProfileClient.PublicUserMetadata({
            address: address,
            metadataSubtree: "name"
          });
        // eslint-disable-next-line no-empty
        } catch(error) {}
      }
    );

    // Inject fromName into all events
    return (
      events.map(eventList =>
        eventList.map(event => {
          const fromName = accountNames[Fabric.utils.FormatAddress(event.from)];
          const toName = event.to ? accountNames[Fabric.utils.FormatAddress(event.to)] : undefined;

          return {
            ...event,
            fromName,
            toName
          };
        })
      )
    );
  },

  ContractName: async (contractAddress) => {
    return await client.ContractName({contractAddress});
  },

  ContractEvent: async ({abi, transactionHash}) => {
    return await client.ContractEvent({abi, transactionHash});
  },

  ContractEvents: async ({contractAddress, abi, fromBlock, toBlock}) => {
    return await Fabric.FormatEvents(
      await client.ContractEvents({contractAddress, abi, fromBlock, toBlock, includeTransaction: true})
    );
  },

  WithdrawContractFunds: ({contractAddress, abi, ether}) => {
    return client.WithdrawContractFunds({contractAddress, abi, ether});
  },

  GetBlockchainEvents: async ({toBlock, fromBlock, count=10}) => {
    return await Fabric.FormatEvents(
      await client.Events({toBlock, fromBlock, count, includeTransaction: true})
    );
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
          return (
            contract.name.toLowerCase().includes(params.filter.toLowerCase()) ||
            contract.description.toLowerCase().includes(params.filter.toLowerCase())
          );
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

  Contracts: async ({params}) => {
    const contracts = (await client.userProfileClient.UserMetadata({
      metadataSubtree: "contracts"
    })) || {};

    return Fabric.FilterContracts({contracts, params});
  },

  DeployedContracts: async ({params}) => {
    const contracts = (await client.userProfileClient.UserMetadata({
      metadataSubtree: "deployedContracts"
    })) || {};

    return Fabric.FilterContracts({contracts, params});
  },

  AddContract: async ({name, description, abi, bytecode}) => {
    await client.userProfileClient.MergeUserMetadata({
      metadataSubtree: UrlJoin("contracts", name),
      metadata: {
        name,
        description,
        abi,
        bytecode
      }
    });
  },

  RemoveContract: async ({name}) => {
    await client.userProfileClient.DeleteUserMetadata({
      metadataSubtree: UrlJoin("contracts", name)
    });
  },

  AddDeployedContract: async ({name, description, address, abi, bytecode, owner}) => {
    address = FormatAddress(address);

    await client.userProfileClient.MergeUserMetadata({
      metadataSubtree: UrlJoin("deployedContracts", address),
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

  RemoveDeployedContract: async ({address}) => {
    await client.userProfileClient.DeleteUserMetadata({
      metadataSubtree: UrlJoin("deployedContracts", address)
    });
  },

  async LibraryGroupAddresses({libraryId, type}) {
    // Get library access groups of the specified type
    let numGroups = await client.CallContractMethod({
      contractAddress: client.utils.HashToAddress(libraryId),
      methodName: type + "GroupsLength"
    });

    numGroups = parseInt(numGroups._hex, 16);

    return await [...Array(numGroups).keys()].limitedMap(
      Fabric.concurrencyLimit,
      async i => {
        try {
          return Fabric.utils.FormatAddress(
            await client.CallContractMethod({
              contractAddress: client.utils.HashToAddress(libraryId),
              methodName: type + "Groups",
              methodArgs: [i]
            })
          );
        } catch(error) {
          // eslint-disable-next-line no-console
          console.error(error);
        }
      }
    );
  },

  async AccessGroupAddresses() {
    return (await client.Collection({collectionType: "accessGroups"}))
      .map(address => Fabric.utils.FormatAddress(address));
  },

  async ListAccessGroups({params, publicOnly=true}) {
    let accessGroupAddresses;
    if(params.libraryId) {
      accessGroupAddresses = await Fabric.LibraryGroupAddresses({libraryId: params.libraryId, type: params.type});
    } else {
      // Get all access groups
      accessGroupAddresses = await Fabric.AccessGroupAddresses();
    }

    let filteredAccessGroups = await accessGroupAddresses.limitedMap(
      Fabric.concurrencyLimit,
      async contractAddress => await Fabric.GetAccessGroup({contractAddress, publicOnly})
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

  async GetAccessGroup({contractAddress, publicOnly=false}) {
    contractAddress = Fabric.utils.FormatAddress(contractAddress);
    const currentAccountAddress = await Fabric.CurrentAccountAddress();

    let owner, ownerName, oauthInfo, metadata = {};
    let isManager = false;
    let isOwner = false;
    let isMember = false;
    let visibility, tenantId;

    try {
      visibility = await client.Visibility({
        id: client.utils.AddressToObjectId(contractAddress)
      });

      if(publicOnly) {
        metadata = {
          public: await client.ContentObjectMetadata({
            libraryId: Fabric.contentSpaceLibraryId,
            objectId: client.utils.AddressToObjectId(contractAddress),
            metadataSubtree: "public"
          }) || {}
        };
      } else {
        owner = Fabric.utils.FormatAddress(
          await client.CallContractMethod({
            contractAddress,
            methodName: "owner"
          })
        );

        isOwner = client.utils.EqualAddress(owner, currentAccountAddress);

        /*
        try {
          ownerName = await client.userProfileClient.PublicUserMetadata({
            address: owner,
            metadataSubtree: "name"
          });
        // eslint-disable-next-line no-empty
        } catch(error) {}

         */

        let tenantIdMeta;
        try {
          tenantIdMeta = await client.CallContractMethod({
            contractAddress,
            methodName: "getMeta",
            methodArgs: ["_tenantId"]
          });
        } catch(error) {
        // eslint-disable-next-line no-console
          console.error("Failed to get tenant ID.", error);
        }

        if(tenantIdMeta) {
          const tenantIdJson = client.utils.FromHex(tenantIdMeta);
          tenantId = tenantIdJson ? JSON.parse(tenantIdJson) : "";
        }

        isManager = await client.CallContractMethod({
          contractAddress,
          methodName: "hasManagerAccess",
          methodArgs: [client.utils.FormatAddress(currentAccountAddress)]
        });

        isMember = await this.IsGroupMember({
          contractAddress,
          memberAddress: this.currentAccountAddress
        });

        try {
          if(isMember) {
            metadata = await client.ContentObjectMetadata({
              libraryId: Fabric.contentSpaceLibraryId,
              objectId: client.utils.AddressToObjectId(contractAddress)
            }) || {};
          } else {
            metadata = await client.ContentObjectMetadata({
              libraryId: Fabric.contentSpaceLibraryId,
              objectId: client.utils.AddressToObjectId(contractAddress),
              metadataSubtree: "public",
              select: [
                "name",
                "description"
              ]
            }) || {};
          }

          if(isOwner) {
            const key = `eluv.jwtv.iusr${Fabric.utils.AddressToHash(currentAccountAddress)}`;
            if(metadata[key]) {
              oauthInfo = await client.DecryptECIES(metadata[key]);

              const kmsKey = Object.keys(metadata).find(key => key.startsWith("eluv.jwtv.ikms"));
              if(kmsKey) {
                oauthInfo.trustAuthorityId = kmsKey.replace("eluv.jwtv.", "");
              }
            }

            oauthInfo.oauthEnabled = await client.CallContractMethod({
              contractAddress,
              methodName: "oauthEnabled"
            });
          }
        } catch(error) {
          // eslint-disable-next-line no-console
          console.error("Failed to determine OAuth info for group", contractAddress);
          // eslint-disable-next-line no-console
          console.error(error);
        }
      }
    } catch(error) {
      // eslint-disable-next-line no-console
      console.error(error);
    }

    return {
      address: contractAddress,
      name: (metadata.public && metadata.public.name) || metadata.name || contractAddress,
      description: (metadata.public && metadata.public.description) || metadata.description,
      oauthIssuer: metadata.oauthIssuer,
      oauthClaims: metadata.oauthClaims,
      metadata,
      owner,
      ownerName,
      isMember,
      isManager,
      isOwner,
      oauthInfo,
      visibility,
      tenantId
    };
  },

  async LinkOAuthGroup({address, oauthIssuer, oauthAud, oauthGroups=[], trustAuthorityId}) {
    await client.LinkAccessGroupToOauth({
      groupAddress: address,
      kmsId: trustAuthorityId,
      oauthConfig: {
        issuer: oauthIssuer,
        claims: {
          aud: oauthAud,
          groups: oauthGroups
        }
      }
    });
  },

  async UnlinkOAuthGroup({address}) {
    await client.UnlinkAccessGroupFromOauth({groupAddress: address});
  },

  async CallBitcodeMethod({
    objectId,
    libraryId,
    writeToken,
    method,
    body,
    constant=true,
    service="default"
  }) {
    return await client.CallBitcodeMethod({
      objectId,
      libraryId,
      writeToken,
      method,
      body,
      constant,
      service
    });
  },

  async ListAccessGroupMembers({contractAddress, showManagers=false, params}) {
    const memberAddresses = showManagers ?
      await client.AccessGroupManagers({contractAddress}) :
      await client.AccessGroupMembers({contractAddress});

    let members = await memberAddresses.limitedMap(
      Fabric.concurrencyLimit,
      async address => {
        let name;
        try {
          name = await client.userProfileClient.PublicUserMetadata({address, metadataSubtree: "name"});
        } catch(error) {
          name = client.utils.FormatAddress(address);
        }

        return {
          name: name || address,
          address
        };
      }
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
