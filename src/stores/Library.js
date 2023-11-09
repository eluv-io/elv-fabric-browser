import {observable, action, flow, computed} from "mobx";
import Fabric from "../clients/Fabric";
import {ParseInputJson} from "elv-components-js";
import {Cancelable} from "../utils/Cancelable";

class LibraryStore {
  @observable libraries = {};
  @observable count = 0;

  @computed get library() {
    const libraryId = this.rootStore.routerStore.libraryId;
    return this.libraries[libraryId];
  }

  @computed get libraryId() {
    return this.rootStore.routerStore.libraryId;
  }

  constructor(rootStore) {
    this.rootStore = rootStore;
  }

  async DefaultKMSId() {
    return await Fabric.DefaultKMSId();
  }

  async DefaultTenantId() {
    return await Fabric.DefaultTenantId();
  }

  @action.bound
  ListContentLibraries = flow(function * ({params}) {
    let { libraries, count } = yield Cancelable(
      params.cancelable,
      async () => await Fabric.ListContentLibraries({params})
    );

    this.libraries = libraries;
    this.count = count;
  });

  @action.bound
  ContentLibrary = flow(function * ({libraryId}) {
    // Preserve listing params
    const {listingParams} = this.libraries[libraryId] || {};

    this.libraries[libraryId] = {
      ...(yield Fabric.GetContentLibrary({libraryId})),
      listingParams: listingParams || {}
    };

    if(!this.libraries[libraryId].isContentSpaceLibrary) {
      // Determine if current user can contribute to the library

      const [contributorGroups, userGroups] = yield Promise.all([
        Fabric.LibraryGroupAddresses({libraryId, type: "contributor"}),
        Fabric.AccessGroupAddresses()
      ]);

      this.libraries[libraryId].canContribute =
        this.libraries[libraryId].isOwner ||
        (contributorGroups.filter(address => userGroups.includes(address))).length > 0;

    }
  });

  @action.bound
  CreateContentLibrary = flow(function * ({name, description, publicMetadata, privateMetadata, image, kmsId, tenantId}) {
    try {
      privateMetadata = ParseInputJson(privateMetadata);
    } catch(error) {
      throw `Invalid Private Metadata: ${error.message}`;
    }

    try {
      publicMetadata = ParseInputJson(publicMetadata);
    } catch(error) {
      throw `Invalid Public Metadata: ${error.message}`;
    }

    publicMetadata.name = name;
    publicMetadata.description = description;

    const libraryId = yield Fabric.CreateContentLibrary({
      name,
      description,
      publicMetadata,
      privateMetadata,
      kmsId,
      tenantId
    });

    if(image) {
      yield Fabric.EditAndFinalizeContentObject({
        libraryId,
        objectId: Fabric.utils.AddressToObjectId(Fabric.utils.HashToAddress(libraryId)),
        commitMessage: "Update library image",
        todo: async (writeToken) => {
          await Fabric.SetContentLibraryImage({
            libraryId,
            writeToken,
            image: await new Response(image).blob(),
            imageName: image.name
          });
        }
      });
    }

    this.rootStore.notificationStore.SetNotificationMessage({
      message: "Successfully created content library '" + name + "'",
      redirect: true
    });

    return libraryId;
  });

  @action.bound
  UpdateContentLibrary = flow(function * ({libraryId, name, description, publicMetadata, privateMetadata, image}) {
    try {
      privateMetadata = ParseInputJson(privateMetadata);
    } catch(error) {
      throw `Invalid Private Metadata: ${error.message}`;
    }

    try {
      publicMetadata = ParseInputJson(publicMetadata);
    } catch(error) {
      throw `Invalid Public Metadata: ${error.message}`;
    }

    privateMetadata.name = name;
    privateMetadata.description = description;

    publicMetadata.name = name;
    publicMetadata.description = description;

    delete privateMetadata.public;

    const libraryObjectId = libraryId.replace("ilib", "iq__");
    yield Fabric.EditAndFinalizeContentObject({
      libraryId,
      objectId: libraryObjectId,
      commitMessage: "Fabric Browser form",
      todo: async (writeToken) => {
        await Fabric.ReplaceMetadata({
          libraryId,
          objectId: libraryObjectId,
          writeToken,
          metadata: {
            ...privateMetadata,
            public: publicMetadata
          }
        });

        if(image) {
          await Fabric.SetContentLibraryImage({
            libraryId,
            writeToken,
            image: await new Response(image).blob(),
            imageName: image.name
          });
        }
      }
    });

    this.rootStore.notificationStore.SetNotificationMessage({
      message: "Successfully updated content library '" + name + "'",
      redirect: true
    });

    return libraryId;
  });

  @action.bound
  ListLibraryTypes = flow(function * ({libraryId}) {
    const types = yield Fabric.ListLibraryContentTypes({libraryId});

    this.libraries[libraryId] = {
      ...(this.libraries[libraryId] || {}),
      types
    };
  });

  @action.bound
  UpdateContentLibraryTypes = flow(function * ({libraryId, typeIds=[]}) {
    const currentTypeIds = Object.values(yield Fabric.ListLibraryContentTypes({libraryId}))
      .map(type => type.id);

    const idsToAdd = typeIds.filter(id => !currentTypeIds.includes(id));

    if(idsToAdd.length > 0) {
      const contentTypes = Object.values((yield Fabric.ListContentTypes({params: {perPage: 1000}})).types);
      for(const typeId of idsToAdd) {
        // When adding a content type, check for custom contract
        const type = contentTypes.find(type => type.id === typeId);
        const customContractAddress = type.meta.custom_contract && type.meta.custom_contract.address;
        yield Fabric.AddLibraryContentType({libraryId, typeId, customContractAddress});
      }
    }

    const idsToRemove = currentTypeIds.filter(id => !typeIds.includes(id));

    for(const typeId of idsToRemove) {
      yield Fabric.RemoveLibraryContentType({libraryId, typeId});
    }

    this.rootStore.notificationStore.SetNotificationMessage({
      message: "Successfully updated content library types",
      redirect: true
    });
  });

  @action.bound
  ListLibraryGroups = flow(function * ({libraryId, type, params}) {
    const { accessGroups, count } = yield Fabric.ListContentLibraryGroups({libraryId, type, params});

    this.libraries[libraryId][`${type}Groups`] = accessGroups;
    this.libraries[libraryId][`${type}GroupsCount`] = count;
  });

  @action.bound
  ContentLibraryGroupPermissions = flow(function * ({libraryId}) {
    let permissions = {};

    const SetPermission = ({address, type}) => {
      permissions[address] = {
        [type]: true,
        ...(permissions[address] || {})
      };
    };

    yield Promise.all(
      ["accessor", "contributor"].map(async type => {
        const {accessGroups} = await Fabric.ListContentLibraryGroups({
          libraryId,
          type,
          params: { paginate: false }
        });

        Object.keys(accessGroups).forEach(address => {
          SetPermission({address, type});
        });
      })
    );

    const managerGroups = yield Fabric.ListContentLibraryManagerGroups({libraryId});
    managerGroups.forEach(address => {
      SetPermission({address, type: "manage"});
    });

    this.libraries[libraryId].groupPermissions = permissions;
  });

  @action.bound
  RemoveContentLibraryGroupPermission = flow(function * ({libraryId, groupAddress, type}) {
    if(type === "manage") {
      yield Fabric.RemoveContentLibraryManagerGroup({libraryId, address: groupAddress});
    } else {
      yield Fabric.RemoveContentLibraryGroup({
        libraryId,
        address: groupAddress,
        groupType: type
      });
    }

    this.rootStore.notificationStore.SetNotificationMessage({
      message: "Successfully removed library group permissions",
      redirect: true
    });
  });

  @action.bound
  UpdateContentLibraryGroup = flow(function * ({
    libraryId,
    groupAddress,
    accessor,
    contributor,
    manage
  }) {
    const options = { accessor, contributor, manage };

    const permissions = this.libraries[libraryId].groupPermissions[groupAddress] || {};

    yield Promise.all(
      ["accessor", "contributor", "manage"].map(async type => {
        if(!permissions[type] && options[type]) {
          // Add group
          if(type === "manage") {
            await Fabric.AddContentLibraryManagerGroup({libraryId, address: groupAddress});
          } else {
            await Fabric.AddContentLibraryGroup({libraryId, address: groupAddress, groupType: type});
          }
        } else if(permissions[type] && !options[type]) {
          // Remove group
          if(type === "manage") {
            await Fabric.RemoveContentLibraryManagerGroup({libraryId, address: groupAddress});
          } else {
            await Fabric.RemoveContentLibraryGroup({libraryId, address: groupAddress, groupType: type});
          }
        }
      })
    );

    this.rootStore.notificationStore.SetNotificationMessage({
      message: "Successfully modified library group permissions",
      redirect: true
    });
  });

  @action.bound
  ListContentObjects = flow(function * ({libraryId, params}) {
    const {objects, count, cacheId} = yield Cancelable(
      params.cancelable,
      async () => await Fabric.ListContentObjects({libraryId, params})
    );

    this.libraries[libraryId].objects = objects;
    this.libraries[libraryId].objectsCount = count;
    this.libraries[libraryId].listingParams = {
      ...params,
      cacheId
    };
  });

  @action.bound
  ClearLibraryCache({libraryId, keepParams=false}) {
    if(!this.libraries[libraryId]) { return; }

    if(keepParams) {
      // Invalidate cache ID, but keep listing params
      if(this.libraries[libraryId].listingParams) {
        delete this.libraries[libraryId].listingParams.cacheId;
      }
    } else {
      // Reset listing params
      this.libraries[libraryId].listingParams = {};
    }
  }

  async LookupContent(contentId) {
    const { path, error } = await Fabric.LookupContent(contentId);

    if(error) {
      this.rootStore.notificationStore.SetErrorMessage({
        message: error
      });
    } else {
      return path;
    }
  }
}


export default LibraryStore;
