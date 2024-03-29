import {observable, action, flow, computed} from "mobx";
import Fabric from "../clients/Fabric";
import {ParseInputJson} from "elv-components-js";
import {Cancelable} from "../utils/Cancelable";

class TypeStore {
  @observable typesLoaded = false;
  @observable allTypes = {};
  @observable types = {};
  @observable count = 0;

  @computed get type() {
    const typeId = this.rootStore.routerStore.objectId;
    return this.types[typeId];
  }

  @computed get typeId() {
    return this.rootStore.routerStore.objectId;
  }

  constructor(rootStore) {
    this.rootStore = rootStore;
  }

  @action.bound
  ListContentTypes = flow(function * ({params}) {
    this.types = {};
    const {types, count} = yield Cancelable(
      params.cancelable,
      async () => Fabric.ListContentTypes({params})
    );

    this.types = types;
    this.count = count;
  });

  @action.bound
  ContentTypes = flow(function * () {
    this.allTypes = (yield Fabric.ListContentTypes({params: {perPage: 1000, skipOwner: true}})).types;

    this.typesLoaded = true;
  });

  @action.bound
  ContentType = flow(function * ({typeId}) {
    this.types[typeId] = yield Fabric.GetContentObject({libraryId: Fabric.contentSpaceLibraryId, objectId: typeId});
  });

  @action.bound
  CreateContentType = flow(function * ({name, description, metadata, bitcode}) {
    try {
      metadata = ParseInputJson(metadata);
    } catch(error) {
      throw `Invalid Metadata: ${error.message}`;
    }

    const typeId = yield Fabric.CreateContentType({
      name,
      description,
      metadata,
      bitcode
    });

    // Automatically add permissions for content admins
    const contentAdminsGroupAddress = yield Fabric.GetContentAdminsGroupAddress();
    yield Fabric.AddContentObjectGroupPermission({
      objectId: typeId,
      groupAddress: contentAdminsGroupAddress,
      permission: "manage"
    });

    this.rootStore.notificationStore.SetNotificationMessage({
      message: "Successfully created content type",
      redirect: true
    });

    return typeId;
  });

  @action.bound
  UpdateContentType = flow(function * ({typeId, name, description, bitcode, metadata, commitMessage}) {
    try {
      metadata = ParseInputJson(metadata);
    } catch(error) {
      throw `Invalid Metadata: ${error.message}`;
    }

    const libraryId = Fabric.contentSpaceLibraryId;

    yield Fabric.EditAndFinalizeContentObject({
      libraryId,
      objectId: typeId,
      commitMessage: commitMessage || "Fabric browser form",
      todo: async (writeToken) => {
        metadata = {
          ...metadata,
          name,
          description,
          public: {
            ...(metadata.public || {}),
            name,
            description
          }
        };

        await Fabric.ReplaceMetadata({
          libraryId,
          objectId: typeId,
          writeToken,
          metadata
        });

        if(bitcode) {
          const uploadResponse = await Fabric.UploadPart({
            libraryId,
            objectId: typeId,
            writeToken,
            file: bitcode,
            encrypted: false
          });

          await Fabric.ReplaceMetadata({
            libraryId,
            objectId: typeId,
            writeToken,
            metadataSubtree: "bitcode_part",
            metadata: uploadResponse.part.hash
          });
        }
      }
    });

    this.rootStore.notificationStore.SetNotificationMessage({
      message: "Successfully updated content type",
      redirect: true
    });

    return typeId;
  });
}


export default TypeStore;
