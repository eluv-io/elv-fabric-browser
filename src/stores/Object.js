import Fabric from "../clients/Fabric";
import {action, computed, flow, observable} from "mobx";
import {DownloadFromUrl, FileInfo} from "../utils/Files";
import UrlJoin from "url-join";
import {ParseInputJson} from "elv-components-js";
import Path from "path";
import {AddressToHash, EqualAddress} from "../utils/Helpers";
const Fetch = typeof fetch !== "undefined" ? fetch : require("node-fetch").default;

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

  @action.bound
  CopyObjectPermission = flow(function * ({libraryId, objectId}) {
    // Determine if owner
    const owner = Fabric.utils.FormatAddress(
      yield Fabric.client.CallContractMethod({
        contractAddress: Fabric.client.utils.HashToAddress(objectId),
        methodName: "owner"
      })
    );
    const isOwner = EqualAddress(owner, yield Fabric.CurrentAccountAddress());

    if(isOwner) { return true; }

    // Determine presence of user cap
    try {
      const userCapKey = `eluv.caps.iusr${AddressToHash(this.currentAccountAddress)}`;

      const hasUserCap = !!(yield Fabric.GetContentObjectMetadata({
        libraryId,
        objectId,
        metadataSubtree: userCapKey
      }));

      return hasUserCap;
    } catch(error) {
      return false;
    }
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
ReplaceMetadata = flow(function * ({
  libraryId,
  objectId,
  writeToken,
  metadataSubtree,
  metadata
}) {
  yield Fabric.ReplaceMetadata({
    libraryId,
    objectId,
    writeToken,
    metadataSubtree,
    metadata
  });
});

@action.bound
MergeMetadata = flow(function * ({
  libraryId,
  objectId,
  writeToken,
  metadataSubtree="/",
  metadata
}) {
  yield Fabric.MergeMetadata({
    libraryId,
    objectId,
    writeToken,
    metadataSubtree,
    metadata
  });
})

  @action.bound
  EditAndFinalizeContentObject = flow(function * ({
    libraryId,
    objectId,
    callback,
    options={},
    commitMessage="",
    publish=true,
    awaitCommitConfirmation=true
  }) {
    yield Fabric.client.EditAndFinalizeContentObject({
      libraryId,
      objectId,
      callback,
      options,
      commitMessage,
      publish,
      awaitCommitConfirmation
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
  PerformSearch = flow(function * ({
    libraryId,
    objectId,
    terms=""
  }) {
    let url = yield Fabric.client.Rep({
      libraryId,
      objectId,
      rep: "search",
      service: "search",
      makeAccessRequest: true,
      queryParams: {
        terms,
        select: "...,text,/public/asset_metadata/title",
        start: 0,
        limit: 15
      }
    });

    const version = yield Fabric.GetContentObjectMetadata({
      libraryId,
      objectId,
      metadataSubtree: "indexer/version"
    });

    if(version === "2.0") {
      const v2Node = yield Fabric.SearchV2();
      const urlEnd = url.split("contentfabric.io");
      const v2Host = v2Node[0].split("contentfabric");
      url = `${v2Host[0]}contentfabric.io${urlEnd[1]}`;
    }

    return yield client.utils.ResponseToJson(yield Fetch(url));
  });

  @action.bound
  SetSearchNodes = flow(function * ({libraryId, objectId}) {
    const version = yield Fabric.GetContentObjectMetadata({
      libraryId,
      objectId,
      metadataSubtree: "indexer/version"
    });

    if(version === "2.0") {
      const v2Node = yield Fabric.SearchV2();

      yield Fabric.client.SetNodes({
        fabricURIs: v2Node,
        service: "search"
      });
    } else {
      const v1Nodes = yield Fabric.SearchV1();

      yield Fabric.client.SetNodes({
        fabricURIs: v1Nodes,
        service: "search"
      });
    }
  })

  @action.bound
  UpdateIndex = flow(function * ({
    libraryId,
    objectId,
    latestHash
  }) {
    yield this.SetSearchNodes({libraryId, objectId});

    let {searchURIs} = yield Fabric.client.Nodes({service: "search"});

    if(!searchURIs || !Array.isArray(searchURIs) || searchURIs.length === 0) {
      throw Error("No search nodes found.");
    }

    const {writeToken} = yield Fabric.EditContentObject({
      libraryId,
      objectId,
      service: "search"
    });

    let lroHandle;
    try {
      const response = yield Fabric.CallBitcodeMethod({
        libraryId,
        objectId,
        writeToken,
        method: "search_update",
        constant: false,
        service: "search"
      });

      lroHandle = response.lro_handle;
    } catch(error) {
      // eslint-disable-next-line no-console
      console.error(error);
      throw error;
    }

    let done;
    let lastRunTime;
    while(!done) {
      let results;

      yield new Promise(resolve => setTimeout(resolve, 30000));

      try {
        results = yield Fabric.CallBitcodeMethod({
          libraryId,
          objectId,
          writeToken,
          method: "crawl_status",
          body: {"lro_handle": lroHandle},
          constant: false,
          service: "search"
        });
      } catch(error) {
        // eslint-disable-next-line no-console
        console.error("Failed to retrieve crawl status", error);
        done = true;
      }

      if(results) {
        lastRunTime = results.custom.duration;

        if(
          results.custom.run_state === "finished" ||
          results.custom.run_state === "failed" ||
          results.state === "terminated"
        ) {
          done = true;
        }
      }
    }

    yield Fabric.ReplaceMetadata({
      objectId,
      libraryId,
      writeToken,
      metadataSubtree: "indexer/last_run",
      metadata: latestHash,
      service: "search"
    });

    yield Fabric.ReplaceMetadata({
      objectId,
      libraryId,
      writeToken,
      metadataSubtree: "indexer/last_run_time",
      metadata: lastRunTime,
      service: "search"
    });

    yield Fabric.FinalizeContentObject({
      objectId,
      libraryId,
      writeToken,
      commitMessage: "Update index",
      service: "search"
    });

    this.objects[objectId].meta = yield Fabric.GetContentObjectMetadata({
      libraryId,
      objectId,
      writeToken,
      service: "search"
    });

    this.rootStore.notificationStore.SetNotificationMessage({
      message: "Successfully finished crawl"
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
  CreateNonOwnerCap = flow(function * ({libraryId, objectId, publicKey, label}) {
    yield Fabric.CreateNonOwnerCap({
      libraryId,
      objectId,
      publicKey,
      label
    });

    this.objects[objectId].meta = yield Fabric.GetContentObjectMetadata({
      libraryId,
      objectId
    });

    this.rootStore.notificationStore.SetNotificationMessage({
      message: "Successfully created non-owner cap"
    });
  });

  @action.bound
  DeleteOwnerCap = flow(function * ({libraryId, objectId, address}) {
    const {writeToken} = yield Fabric.EditContentObject({libraryId, objectId});

    yield Fabric.DeleteMetadata({
      libraryId,
      objectId,
      writeToken,
      metadataSubtree: `eluv.caps.iusr${AddressToHash(address)}`
    });

    yield Fabric.DeleteMetadata({
      libraryId,
      objectId,
      writeToken,
      metadataSubtree: `/owner_caps/${address}`
    });

    yield Fabric.FinalizeContentObject({
      libraryId,
      objectId,
      writeToken,
      commitMessage: "Delete non-owner cap"
    });

    this.objects[objectId].meta = yield Fabric.GetContentObjectMetadata({
      libraryId,
      objectId
    });

    this.rootStore.notificationStore.SetNotificationMessage({
      message: "Successfully deleted non-owner cap"
    });
  });

  @action.bound
  GetContentObjectMetadata = flow(function * ({
    libraryId,
    objectId,
    versionHash,
    writeToken,
    metadataSubtree="/"
  }) {
    return yield Fabric.GetContentObjectMetadata({
      libraryId,
      objectId,
      versionHash,
      writeToken,
      metadataSubtree
    });
  });

  @action.bound
  LatestVersionHash = flow(function * ({objectId, versionHash}) {
    if(!objectId) objectId = Fabric.utils.DecodeVersionHash(versionHash).objectId;

    return yield Fabric.LatestVersionHash({
      objectId,
      versionHash
    });
  });
}

export default ObjectStore;
