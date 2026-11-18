import {observable, action, flow, computed, makeAutoObservable} from "mobx";
import Fabric from "@/client/Fabric";
import {ParseInputJson} from "@/utils/Helpers";

import {Cancelable} from "@/utils/Cancelable";

class TypeStore {
  typesLoaded = false;
  allTypes = {};
  types = {};
  count = 0;

  get type() {
    const typeId = this.rootStore.routerStore.objectId;
    return this.types[typeId];
  }

  get typeId() {
    return this.rootStore.routerStore.objectId;
  }

  constructor(rootStore) {
    makeAutoObservable(this);

    this.rootStore = rootStore;
  }


  ListContentTypes = flow(function * ({params}) {
    this.types = {};
    const {types, count} = yield Cancelable(
      params.cancelable,
      async () => Fabric.ListContentTypes({params})
    );

    this.types = types;
    this.count = count;
  });


  ContentTypes = flow(function * () {
    this.allTypes = (yield Fabric.ListContentTypes({params: {perPage: 1000, skipOwner: true}})).types;

    this.typesLoaded = true;
  });


  ContentType = flow(function * ({typeId}) {
    this.types[typeId] = yield Fabric.GetContentObject({libraryId: Fabric.contentSpaceLibraryId, objectId: typeId});
  });


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
