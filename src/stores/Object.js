import Fabric from "../clients/Fabric";
import {action, computed, flow, observable} from "mobx";
import {DownloadFromUrl, FileInfo} from "../utils/Files";
import UrlJoin from "url-join";
import {ParseInputJson} from "elv-components-js";
import Path from "path";

const concurrentUploads = 3;

class ObjectStore {
  @observable writeTokens = {};

  @computed get libraryId() {
    return this.rootStore.routerStore.libraryId;
  }

  @computed get objectId() {
    return this.rootStore.routerStore.objectId ||
      this.rootStore.routerStore.contractAddress && Fabric.utils.AddressToObjectId(this.rootStore.routerStore.contractAddress);
  }

  @computed get object() {
    return this.objects[this.objectId];
  }

  @computed get objectGroupPermissions() {
    return this.objects[this.objectId].groupPermissions;
  }

  @computed get currentAccountAddress() {
    return this.rootStore.currentAccountAddress;
  }

  constructor(rootStore) {
    this.rootStore = rootStore;

    // Don't store objects in observable, it's very slow for large amounts of meta
    this.objects = {};
    this.versions = {};
  }

  @action.bound
  ContentObject = flow(function * ({libraryId, objectId}) {
    const object = yield Fabric.GetContentObject({libraryId, objectId});

    this.objects[objectId] = object;
    this.versions[object.hash] = object;
  });

  @action.bound
  ContentObjectVersions = flow(function * ({libraryId, objectId}) {
    this.objects[objectId].versions = yield Fabric.GetContentObjectVersions({libraryId, objectId});
  });

  @action.bound
  ContentObjectVersion = flow(function * ({versionHash}) {
    if(this.versions[versionHash]) { return; }

    this.versions[versionHash] = yield Fabric.GetContentObjectVersion({versionHash});
  });

  @action.bound
  ContentObjectParts = flow(function * ({versionHash}) {
    if(this.versions[versionHash] && this.versions[versionHash].parts) { return; }

    // Version should be loaded at this point, but make sure
    yield this.ContentObjectVersion({versionHash});

    this.versions[versionHash].parts = yield Fabric.ListParts({versionHash});
  });

  @action.bound
  ContentObjectPermissions = flow(function * ({libraryId, objectId}) {
    this.objects[objectId].permissions = yield Fabric.GetContentObjectPermissions({libraryId, objectId});
  });

  @action.bound
  ContentObjectGroupPermissions = flow(function * ({objectId}) {
    this.objects[objectId].groupPermissions = yield Fabric.GetContentObjectGroupPermissions({objectId});
  });

  @action.bound
  UpdateContentObject = flow(function * ({
    libraryId,
    objectId,
    type,
    name,
    description,
    privateMetadata,
    publicMetadata,
    image,
    commitMessage
  }) {
    try {
      privateMetadata = ParseInputJson(privateMetadata);
      publicMetadata = ParseInputJson(publicMetadata);
    } catch(error) {
      throw `Invalid Metadata: ${error.message}`;
    }

    const create = !objectId;

    let editResponse;
    if(create) {
      // Create
      editResponse = yield Fabric.CreateContentObject({libraryId, type});
    } else {
      // Edit
      editResponse = yield Fabric.EditContentObject({libraryId, objectId, options: { type }});
    }

    const writeToken = editResponse.write_token;
    objectId = editResponse.id;

    const metadata = {
      ...privateMetadata,
      public: {
        ...(privateMetadata.public || {}),
        ...publicMetadata,
        name,
        description
      }
    };

    yield Fabric.ReplaceMetadata({
      libraryId,
      objectId,
      writeToken,
      metadata
    });

    if(image) {
      yield Fabric.SetContentObjectImage({
        libraryId,
        objectId,
        writeToken,
        image: yield new Response(image).blob(),
        imageName: image.name
      });
    }

    yield Fabric.FinalizeContentObject({
      libraryId,
      objectId,
      writeToken,
      commitMessage: commitMessage || "Fabric Browser form"
    });

    this.rootStore.notificationStore.SetNotificationMessage({
      message: `Successfully ${create ? "created": "updated"} content`,
      redirect: true
    });

    // Clear library listing cache
    this.rootStore.libraryStore.ClearLibraryCache({libraryId, keepParams: true});

    return objectId;
  });

  @action.bound
  DeleteContentObject = flow(function * ({libraryId, objectId}) {
    yield Fabric.DeleteContentObject({libraryId, objectId});

    this.rootStore.notificationStore.SetNotificationMessage({
      message: "Successfully deleted content object",
      redirect: true
    });

    // Clear library listing cache
    this.rootStore.libraryStore.ClearLibraryCache({libraryId, keepParams: true});
  });

  @action.bound
  DeleteContentObjectVersion = flow(function * ({libraryId, objectId, versionHash}) {
    yield Fabric.DeleteContentVersion({libraryId, objectId, versionHash});

    delete this.versions[versionHash];

    this.rootStore.notificationStore.SetNotificationMessage({
      message: "Successfully deleted content version",
      redirect: true
    });

    // Clear library listing cache
    this.rootStore.libraryStore.ClearLibraryCache({libraryId, keepParams: true});
  });

  @action.bound
  EditContentObject = flow(function * ({libraryId, objectId, action=""}) {
    const object = this.objects[objectId];

    if(!object) {
      throw Error("Unknown Object: " + objectId);
    }

    const writeToken = this.writeTokens[objectId];

    if(!writeToken) {
      const {write_token} = yield Fabric.EditContentObject({
        libraryId,
        objectId
      });

      this.writeTokens[objectId] = write_token;

      this.objects[objectId].baseFileUrl = yield Fabric.FileUrl({
        libraryId,
        objectId,
        writeToken: write_token,
        filePath: "/"
      });

      object.draftActions = [];
    }

    if(action) {
      object.draftActions.push(action);
    }

    return this.writeTokens[objectId];
  });

  @action.bound CopyContentObject = flow(function * ({libraryId, originalVersionHash, options={}}) {
    const response = yield Fabric.CopyContentObject({libraryId, originalVersionHash, options});

    this.rootStore.notificationStore.SetNotificationMessage({
      message: "Successfully copied object",
      redirect: true
    });

    return response;
  });

  @action.bound
  FinalizeContentObject = flow(function * ({libraryId, objectId}) {
    const object = this.objects[objectId];

    if(!object) {
      throw Error("Unknown Object: " + objectId);
    }

    const writeToken = this.writeTokens[objectId];

    if(!writeToken) {
      throw Error("No write token for " + objectId);
    }

    const actions = [...new Set((object.draftActions || []))];
    const response = yield Fabric.FinalizeContentObject({
      libraryId,
      objectId,
      writeToken,
      commitMessage: actions.join(", ")
    });

    delete this.writeTokens[objectId];

    return response;
  });

  @action.bound
  DiscardWriteToken({objectId}) {
    delete this.writeTokens[objectId];
  }

  @action.bound
  UpdateMetadata = flow(function * ({libraryId, objectId, metadataSubtree="/", metadata}) {
    const writeToken = yield this.EditContentObject({libraryId, objectId, action: "Update metadata"});

    yield Fabric.ReplaceMetadata({
      libraryId,
      objectId,
      writeToken,
      metadataSubtree,
      metadata
    });

    this.objects[objectId].meta = yield Fabric.GetContentObjectMetadata({
      libraryId,
      objectId,
      writeToken
    });

    this.rootStore.notificationStore.SetNotificationMessage({
      message: "Successfully updated metadata"
    });
  });

  @action.bound
  DeleteMetadata = flow(function * ({libraryId, objectId, metadataSubtree="/"}) {
    const writeToken = yield this.EditContentObject({libraryId, objectId});

    yield Fabric.DeleteMetadata({
      libraryId,
      objectId,
      writeToken,
      metadataSubtree
    });

    this.objects[objectId].meta = yield Fabric.GetContentObjectMetadata({
      libraryId,
      objectId,
      writeToken
    });

    this.rootStore.notificationStore.SetNotificationMessage({
      message: "Successfully deleted metadata"
    });
  });

  @action.bound
  UploadFiles = flow(function * ({libraryId, objectId, path, fileList, encrypt, callback}) {
    const writeToken = yield this.EditContentObject({libraryId, objectId, action: "Upload files"});

    const fileInfo = yield FileInfo(path, fileList);

    yield Fabric.UploadFiles({libraryId, objectId, writeToken, fileInfo, encrypt, callback});

    this.objects[objectId].meta.files = yield Fabric.GetContentObjectMetadata({
      libraryId,
      objectId,
      writeToken,
      metadataSubtree: "files"
    });

    this.rootStore.notificationStore.SetNotificationMessage({
      message: "Successfully uploaded files"
    });
  });

  // Set object image from existing file
  async GetFileUrl({libraryId, objectId, writeToken, filePath}) {
    return await Fabric.FileUrl({libraryId, objectId, writeToken, filePath});
  }

  // Set object image from existing file
  @action.bound
  SetExistingObjectImage = flow(function * ({libraryId, objectId, filePath}) {
    const writeToken = yield this.EditContentObject({libraryId, objectId, action: "Set object image"});

    yield Fabric.ReplaceMetadata({
      libraryId,
      objectId,
      writeToken,
      metadataSubtree: "public/display_image",
      metadata: {
        "/": UrlJoin(".", "files", filePath)
      }
    });

    this.rootStore.notificationStore.SetNotificationMessage({
      message: "Successfully updated image on object draft"
    });
  });

  @action.bound
  SetPermission = flow(function * ({objectId, permission}) {
    this.rootStore.notificationStore.ClearMessage();

    yield Fabric.SetPermission({objectId, permission});

    this.rootStore.notificationStore.SetNotificationMessage({
      message: "Successfully updated object permissions",
      redirect: true
    });
  });

  async DownloadUrl({libraryId, objectId, versionHash, writeToken, filePath, callback}) {
    const blob = await Fabric.DownloadFile({
      libraryId,
      objectId,
      versionHash,
      writeToken,
      filePath,
      format: "blob",
      callback
    });

    return window.URL.createObjectURL(blob);
  }

  async DownloadFile(params) {
    try {
      await DownloadFromUrl(await this.DownloadUrl(params), Path.basename(params.filePath));
    } catch(error) {
      this.rootStore.notificationStore.SetErrorMessage({
        message: "Unable to download file"
      });
    }
  }

  @action.bound
  CreateDirectory = flow(function * ({libraryId, objectId, directory}) {
    const writeToken = yield this.EditContentObject({libraryId, objectId, action: `Create directory '${directory.replace("./", "")}'`});

    yield Fabric.CreateDirectory({libraryId, objectId, writeToken, directory});

    this.objects[objectId].meta.files = yield Fabric.GetContentObjectMetadata({
      libraryId,
      objectId,
      writeToken,
      metadataSubtree: "files"
    });

    this.rootStore.notificationStore.SetNotificationMessage({
      message: "Successfully added directory " + directory
    });
  });

  @action.bound
  DeleteFiles = flow(function * ({libraryId, objectId, filePaths}) {
    const writeToken = yield this.EditContentObject({libraryId, objectId, action: `Delete file '${filePaths[0]}'`});

    yield Fabric.DeleteFiles({libraryId, objectId, writeToken, filePaths});

    this.objects[objectId].meta.files = yield Fabric.GetContentObjectMetadata({
      libraryId,
      objectId,
      writeToken,
      metadataSubtree: "files"
    });

    this.rootStore.notificationStore.SetNotificationMessage({
      message: "Successfully deleted file" + filePaths.length > 0 ? "s" : ""
    });
  });

  async FileUrl({libraryId, objectId, versionHash, filePath}) {
    return await Fabric.FileUrl({libraryId, objectId, versionHash, filePath});
  }

  @action.bound
  UploadParts = flow(function * ({libraryId, objectId, files, encrypt=false, callback}) {
    let parts = {};
    const contentDraft = yield Fabric.EditContentObject({libraryId, objectId});

    yield Array.from(files).limitedMap(
      concurrentUploads,
      async file => {
        let partCallback;
        if(callback) {
          partCallback = ({uploaded, total}) => callback({uploaded, total, filename: file.name});
        }

        parts[file.name] = (
          await Fabric.UploadPart({
            libraryId,
            objectId,
            writeToken: contentDraft.write_token,
            file,
            encrypt,
            chunkSize: 10000000,
            callback: partCallback
          })
        ).part.hash;
      }
    );

    yield Fabric.MergeMetadata({
      libraryId,
      objectId,
      writeToken: contentDraft.write_token,
      metadataSubtree: "eluv-fb.parts",
      metadata: parts
    });

    yield Fabric.FinalizeContentObject({
      libraryId,
      objectId,
      writeToken: contentDraft.write_token,
      commitMessage: "Upload parts",
      awaitCommitConfirmation: false
    });

    const partsText = files.length > 1 ? "parts" : "part";

    this.rootStore.notificationStore.SetNotificationMessage({
      message: "Successfully uploaded " + partsText,
      redirect: true
    });
  });

  async DownloadPart({libraryId, objectId, versionHash, partHash, callback}) {
    callback({bytesFinished: 0, bytesTotal: 1});
    let chunks = [];
    await Fabric.DownloadPart({
      libraryId,
      objectId,
      versionHash,
      partHash,
      format: "arrayBuffer",
      chunked: true,
      chunkSize: 10000000,
      callback: ({bytesFinished, bytesTotal, chunk}) => {
        callback({bytesFinished, bytesTotal});
        chunks.push(chunk);
      }
    });

    return window.URL.createObjectURL(new Blob(chunks));
  }

  @action.bound
  FinalizeABRMezzanine = flow(function * ({libraryId, objectId}) {
    yield Fabric.FinalizeABRMezzanine({libraryId, objectId});

    this.rootStore.notificationStore.SetNotificationMessage({
      message: "Successfully finalized ABR Mezzanine"
    });
  });

  @action.bound
  UpdateContentObjectGroupPermissions = flow(function * ({
    objectId,
    groupAddress,
    see,
    access,
    manage
  }) {
    const currentPermissions = (this.objects[objectId].groupPermissions[groupAddress] || {}).permissions || [];

    let toAdd = [];
    if(see && !currentPermissions.includes("see")) { toAdd.push("see"); }
    if(access && !currentPermissions.includes("access")) { toAdd.push("access"); }
    if(manage && !currentPermissions.includes("manage")) { toAdd.push("manage"); }

    for(let i = 0; i < toAdd.length; i++) {
      yield Fabric.AddContentObjectGroupPermission({objectId, groupAddress, permission: toAdd[i]});
    }

    let toRemove = [];
    if(!see && currentPermissions.includes("see")) { toRemove.push("see"); }
    if(!access && currentPermissions.includes("access")) { toRemove.push("access"); }
    if(!manage && currentPermissions.includes("manage")) { toRemove.push("manage"); }

    for(let i = 0; i < toRemove.length; i++) {
      yield Fabric.RemoveContentObjectGroupPermission({objectId, groupAddress, permission: toRemove[i]});
    }
  });

  @action.bound
  UpdateApps = flow(function * ({libraryId, objectId, apps}) {
    yield Fabric.EditAndFinalizeContentObject({
      libraryId,
      objectId,
      commitMessage: "Update apps",
      todo: async (writeToken) => {
        for(const role of Object.keys(apps)) {
          const appInfo = apps[role];
          const appKey = `${role}App`;

          if(appInfo.appType === "custom-upload") {
            if(!appInfo.fileParams) {
              continue;
            }

            const fileInfo = await FileInfo(appKey, appInfo.fileParams.fileList, false, appInfo.fileParams.isDirectory);

            if(!fileInfo.find(file => file.path.endsWith("index.html"))) {
              throw Error("App must contain an index.html file");
            }

            await Fabric.UploadFiles({
              libraryId,
              objectId,
              writeToken,
              fileInfo
            });

            await Fabric.ReplaceMetadata({
              libraryId,
              objectId,
              writeToken,
              metadataSubtree: `public/eluv.${role}App`,
              metadata: UrlJoin(appKey, "index.html")
            });
          } else if(appInfo.appType === "custom-url") {
            const url = appInfo.appPath;

            if(!url || !(url.startsWith("http://") || url.startsWith("https://"))) {
              throw Error("App URL is invalid");
            }

            await Fabric.ReplaceMetadata({
              libraryId,
              objectId,
              writeToken,
              metadataSubtree: `public/eluv.${role}App`,
              metadata: url
            });
          } else if(!appInfo.appType) {
            await Fabric.DeleteMetadata({
              libraryId,
              objectId,
              writeToken,
              metadataSubtree: `public/eluv.${role}App`
            });

            await Fabric.DeleteMetadata({
              libraryId,
              objectId,
              writeToken,
              metadataSubtree: `eluv.${role}App`
            });
          } else {
            await Fabric.ReplaceMetadata({
              libraryId,
              objectId,
              writeToken,
              metadataSubtree: `public/eluv.${role}App`,
              metadata: appInfo.appType
            });
          }
        }
      }
    });

    this.rootStore.notificationStore.SetNotificationMessage({
      message: "Successfully updated apps",
      redirect: true
    });
  });

  @action.bound
  PublishContentObject = flow(function * ({objectId}) {
    yield Fabric.PublishContentObject({objectId});

    this.rootStore.notificationStore.SetNotificationMessage({
      message: "Successfully updated content object",
      redirect: true
    });
  });

  @action.bound
  CreateOwnerCap = flow(function * ({libraryId, objectId, publicKey, publicAddress}) {
    yield Fabric.CreateOwnerCap({
      libraryId,
      objectId,
      publicKey,
      publicAddress
    });

    this.objects[objectId].meta = yield Fabric.GetContentObjectMetadata({
      libraryId,
      objectId
    });

    this.rootStore.notificationStore.SetNotificationMessage({
      message: "Successfully created owner cap"
    });
  });

  @action.bound
  DeleteOwnerCap = flow(function * ({libraryId, objectId, metadataSubtree}) {
    const {writeToken} = yield Fabric.EditContentObject({libraryId, objectId});

    yield Fabric.DeleteMetadata({
      libraryId,
      objectId,
      writeToken,
      metadataSubtree
    });

    yield Fabric.FinalizeContentObject({
      libraryId,
      objectId,
      writeToken,
      commitMessage: "Delete owner cap"
    });

    this.objects[objectId].meta = yield Fabric.GetContentObjectMetadata({
      libraryId,
      objectId
    });

    this.rootStore.notificationStore.SetNotificationMessage({
      message: "Successfully deleted owner cap"
    });
  });
}

export default ObjectStore;
