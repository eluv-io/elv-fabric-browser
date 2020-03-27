import Fabric from "../clients/Fabric";
import {action, computed, flow, observable} from "mobx";
import {DownloadFromUrl, FileInfo} from "../utils/Files";
import UrlJoin from "url-join";
import {ParseInputJson} from "elv-components-js";
import {ToList} from "../utils/TypeSchema";
import Path from "path";

const concurrentUploads = 3;

class ObjectStore {
  @observable objects = {};
  @observable versions = {};

  @computed get libraryId() {
    return this.rootStore.routerStore.libraryId;
  }

  @computed get objectId() {
    return this.rootStore.routerStore.objectId;
  }

  @computed get object() {
    const objectId = this.rootStore.routerStore.objectId;
    return this.objects[objectId];
  }

  constructor(rootStore) {
    this.rootStore = rootStore;
  }

  @action.bound
  ContentObject = flow(function * ({libraryId, objectId}) {
    this.objects[objectId] = yield Fabric.GetContentObject({libraryId, objectId});
  });

  @action.bound
  ContentObjectVersions = flow(function * ({libraryId, objectId}) {
    this.objects[objectId].versions = yield Fabric.GetContentObjectVersions({libraryId, objectId});

    // Load first version
    yield this.ContentObjectVersion({
      versionHash: this.objects[objectId].versions[0]
    });
  });

  @action.bound
  ContentObjectVersion = flow(function * ({versionHash}) {
    if(this.versions[versionHash]) { return; }

    this.versions[versionHash] = yield Fabric.GetContentObjectVersion({versionHash});
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
  UpdateFromContentTypeSchema = flow(function * ({libraryId, objectId, type, metadata, publicMetadata, accessCharge, schema, fields, callback}) {
    try {
      metadata = ParseInputJson(metadata);
      publicMetadata = ParseInputJson(publicMetadata);
    } catch(error) {
      throw `Invalid Metadata: ${error.message}`;
    }

    let editResponse;
    if(objectId) {
      // Edit
      editResponse = yield Fabric.EditContentObject({libraryId, objectId, options: { type }});
    } else {
      // Create
      editResponse = yield Fabric.CreateContentObject({libraryId, type});
    }

    const writeToken = editResponse.write_token;
    objectId = editResponse.id;

    const collectedMetadata = yield this.CollectMetadata({libraryId, writeToken, schema, fields, callback});

    metadata = {
      ...metadata,
      ...collectedMetadata,
      public: {
        ...(metadata.public || {}),
        ...publicMetadata,
        ...(collectedMetadata.public || {})
      }
    };

    yield Fabric.ReplaceMetadata({
      libraryId,
      objectId,
      writeToken,
      metadata
    });

    if(yield Fabric.IsNormalObject({objectId})) {
      yield Fabric.SetAccessCharge({objectId: objectId, accessCharge});
    }

    yield Fabric.FinalizeContentObject({libraryId, objectId, writeToken});

    this.rootStore.notificationStore.SetNotificationMessage({
      message: "Successfully updated content",
      redirect: true
    });

    // Clear library listing cache
    this.rootStore.libraryStore.ClearLibraryCache({libraryId});

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
    this.rootStore.libraryStore.ClearLibraryCache({libraryId});
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
    this.rootStore.libraryStore.ClearLibraryCache({libraryId});
  });

  @action.bound
  EditContentObject = flow(function * ({libraryId, objectId}) {
    const object = this.objects[objectId];

    if(!object) {
      throw Error("Unknown Object: " + objectId);
    }

    const writeToken = object.writeToken;

    if(!writeToken) {
      const {write_token} = yield Fabric.EditContentObject({
        libraryId,
        objectId
      });

      this.objects[objectId].writeToken = write_token;
      this.objects[objectId].baseFileUrl = yield Fabric.FileUrl({
        libraryId,
        objectId,
        writeToken: write_token,
        filePath: "/"
      });
    }

    return this.objects[objectId].writeToken;
  });

  @action.bound
  FinalizeContentObject = flow(function * ({libraryId, objectId}) {
    const object = this.objects[objectId];

    if(!object) {
      throw Error("Unknown Object: " + objectId);
    }

    const writeToken = object.writeToken;

    if(!writeToken) {
      throw Error("No write token for " + objectId);
    }

    const response = yield Fabric.FinalizeContentObject({
      libraryId,
      objectId,
      writeToken
    });

    this.objects[objectId].writeToken = "";

    return response;
  });

  @action.bound
  UpdateMetadata = flow(function * ({libraryId, objectId, metadataSubtree="/", metadata}) {
    const writeToken = yield this.EditContentObject({libraryId, objectId});

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
    const writeToken = yield this.EditContentObject({libraryId, objectId});

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

  async DownloadUrl({libraryId, objectId, versionHash, writeToken, filePath, callback}) {
    let blob = await Fabric.DownloadFile({libraryId, objectId, versionHash, writeToken, filePath, format: "blob", callback});
    return window.URL.createObjectURL(blob);
  }

  async DownloadFile(params) {
    await DownloadFromUrl(await this.DownloadUrl(params), Path.basename(params.filePath));
  }

  @action.bound
  CreateDirectory = flow(function * ({libraryId, objectId, directory}) {
    const writeToken = yield this.EditContentObject({libraryId, objectId});

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
    const writeToken = yield this.EditContentObject({libraryId, objectId});

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
    const currentPermissions = (this.object.groupPermissions[groupAddress] || {}).permissions || [];

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
  AddApp = flow(function * ({libraryId, objectId, role, isDirectory, fileList, callback, useDefault=false}) {
    const app = `${role}App`;

    let fileInfo;
    if(!useDefault) {
      fileInfo = yield FileInfo(app, fileList, false, isDirectory);

      if(!fileInfo.find(file => file.path.endsWith("index.html"))) {
        throw Error("App must contain an index.html file");
      }
    }

    yield Fabric.EditAndFinalizeContentObject({
      libraryId,
      objectId,
      todo: async (writeToken) => {
        if(useDefault) {
          await Fabric.ReplaceMetadata({
            libraryId,
            objectId,
            writeToken,
            metadataSubtree: `eluv.${role}App`,
            metadata: "default"
          });
        } else {
          await Fabric.UploadFiles({
            libraryId,
            objectId,
            writeToken,
            fileInfo,
            callback
          });

          await Fabric.ReplaceMetadata({
            libraryId,
            objectId,
            writeToken,
            metadataSubtree: `eluv.${role}App`,
            metadata: UrlJoin(app, "index.html")
          });
        }

      }
    });

    this.rootStore.notificationStore.SetNotificationMessage({
      message: "Successfully added " + role + " app",
      redirect: true
    });
  });

  @action.bound
  RemoveApp = flow(function * ({libraryId, objectId, role}) {
    yield Fabric.EditAndFinalizeContentObject({
      libraryId,
      objectId,
      todo: async (writeToken) => {
        await Fabric.DeleteMetadata({
          libraryId,
          objectId,
          writeToken,
          metadataSubtree: `eluv.${role}App`
        });
      }
    });

    this.rootStore.notificationStore.SetNotificationMessage({
      message: "Successfully removed " + role + " app",
      redirect: true
    });
  });

  async CollectMetadata({libraryId, objectId, writeToken, schema, fields, callback}) {
    let metadata = {};

    for(const entry of schema) {
      switch(entry.type) {
        case "label":
        case "attachedFile":
          break;
        case "file":
          // Freshly uploaded files will be a FileList
          // previously uploaded files will either be a string or a list of strings
          if(Array.isArray(fields[entry.key]) || typeof fields[entry.key] === "string") {
            metadata[entry.key] = fields[entry.key];
            break;
          }

          const files = Array.from(fields[entry.key]);
          let partResponses = [];

          for(const file of files) {
            let uploadCallback;
            if(callback) {
              uploadCallback = ({status, uploaded, total}) =>
                callback({key: entry.key, status, uploaded, total, filename: file.name});
            }

            partResponses.push(
              await Fabric.UploadPart({
                libraryId,
                objectId,
                writeToken,
                file,
                chunkSize: 2000000,
                callback: uploadCallback
              })
            );
          }

          if(entry.multiple) {
            metadata[entry.key] = partResponses.map(partResponse => partResponse.part.hash);
          } else {
            metadata[entry.key] = partResponses.length > 0 ? partResponses[0].part.hash : "";
          }

          break;

        case "json":
          try {
            metadata[entry.key] = ParseInputJson(fields[entry.key]);
          } catch(error) {
            throw `Invalid ${entry.key}: ${error.message}`;
          }
          break;

        case "list":
          metadata[entry.key] = ToList(fields[entry.key]).filter(item => item);
          break;
        case "object":
          metadata[entry.key] = await this.CollectMetadata({
            libraryId,
            objectId,
            writeToken,
            schema: entry.fields,
            fields: fields[entry.key]
          });
          break;

        default:
          metadata[entry.key] = fields[entry.key];
      }
    }

    return metadata;
  }

  @action.bound
  PublishContentObject = flow(function * ({objectId}) {
    yield Fabric.PublishContentObject({objectId});

    this.rootStore.notificationStore.SetNotificationMessage({
      message: "Successfully updated content object",
      redirect: true
    });
  });

  @action.bound
  RevewContentObject = flow(function * ({libraryId, objectId, approve, note}) {
    yield Fabric.ReviewContentObject({libraryId, objectId, approve, note});

    const currentAccountAddress = yield Fabric.CurrentAccountAddress();

    yield Fabric.EditAndFinalizeContentObject({
      libraryId,
      objectId,
      todo: async (writeToken) => {
        await Fabric.MergeMetadata({
          libraryId,
          writeToken,
          metadata: {
            "eluv.reviewer": currentAccountAddress,
            "eluv.reviewNote": note
          }
        });
      }
    });

    this.rootStore.notificationStore.SetNotificationMessage({
      message: "Successfully updated content object",
      redirect: true
    });
  });
}

export default ObjectStore;
