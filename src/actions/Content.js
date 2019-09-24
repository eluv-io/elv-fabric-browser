import ActionTypes from "./ActionTypes";
import Fabric from "../clients/Fabric";
import { SetNotificationMessage } from "./Notifications";
import { ParseInputJson } from "elv-components-js";
import { ToList } from "../utils/TypeSchema";
import { DownloadFromUrl, FileInfo } from "../utils/Files";
import Path from "path";
import { WithCancel } from "../utils/Cancelable";

export const ListContentLibraries = ({params}) => {
  return async (dispatch) => {
    let {libraries, count} = await WithCancel(
      params.cancelable,
      async () => await Fabric.ListContentLibraries({params})
    );

    // Exclude special content space library
    delete libraries[Fabric.contentSpaceLibraryId];

    dispatch({
      type: ActionTypes.content.libraries.list,
      libraries,
      count
    });

    dispatch(ClearAllLibraryListingCacheIds());
  };
};

export const GetContentLibrary = ({libraryId}) => {
  return async (dispatch) => {
    const library = await Fabric.GetContentLibrary({libraryId});

    dispatch({
      type: ActionTypes.content.libraries.get,
      libraryId: libraryId,
      library
    });
  };
};

export const ListLibraryContentTypes = ({libraryId}) => {
  return async (dispatch) => {
    const types = await Fabric.ListLibraryContentTypes({libraryId});

    dispatch({
      type: ActionTypes.content.libraries.types,
      libraryId: libraryId,
      types
    });
  };
};

export const ListContentLibraryGroups = ({libraryId, type, params}) => {
  return async (dispatch) => {
    // Content space does not have groups
    if(libraryId === Fabric.contentSpaceLibraryId) { return; }

    const {accessGroups, count} = await Fabric.ListContentLibraryGroups({libraryId, type, params});

    dispatch({
      type: ActionTypes.content.libraries.groups,
      libraryId,
      groups: accessGroups,
      count
    });
  };
};

export const ListContentLibraryGroupPermissions = ({libraryId}) => {
  return async (dispatch) => {
    let permissions = {};
    await Promise.all(
      ["accessor", "contributor", "reviewer"].map(async type => {
        const {accessGroups} = await Fabric.ListContentLibraryGroups({
          libraryId,
          type,
          params: { paginate: false }
        });

        Object.keys(accessGroups).forEach(address => {
          permissions[address] = {
            [type]: true,
            ...(permissions[address] || {})
          };
        });
      })
    );

    dispatch({
      type: ActionTypes.content.libraries.groupPermissions,
      libraryId,
      permissions
    });
  };
};

export const CreateContentLibrary = ({name, description, publicMetadata, privateMetadata, image, kmsId}) => {
  return async (dispatch) => {
    privateMetadata = ParseInputJson(privateMetadata);
    publicMetadata = ParseInputJson(publicMetadata);

    publicMetadata.name = name;
    publicMetadata["eluv.description"] = description;

    const libraryId = await Fabric.CreateContentLibrary({
      name,
      description,
      publicMetadata,
      privateMetadata,
      kmsId
    });

    if(image) {
      await Fabric.SetContentLibraryImage({
        libraryId,
        image: await new Response(image).blob()
      });
    }

    dispatch(SetNotificationMessage({
      message: "Successfully created content library '" + name + "'",
      redirect: true
    }));

    return libraryId;
  };
};

export const UpdateContentLibrary = ({
  libraryId,
  name,
  description,
  privateMetadata={},
  publicMetadata={},
  image
}) => {
  return async (dispatch) => {
    privateMetadata = ParseInputJson(privateMetadata);
    privateMetadata.name = name;
    privateMetadata["eluv.description"] = description;

    publicMetadata = ParseInputJson(publicMetadata);
    publicMetadata.name = name;
    publicMetadata["eluv.description"] = description;

    delete privateMetadata.public;

    const libraryObjectId = libraryId.replace("ilib", "iq__");
    await Fabric.EditAndFinalizeContentObject({
      libraryId,
      objectId: libraryObjectId,
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
      }
    });

    if(image) {
      await Fabric.SetContentLibraryImage({
        libraryId,
        image: await new Response(image).blob()
      });
    }

    dispatch(SetNotificationMessage({
      message: "Successfully updated content library '" + name + "'",
      redirect: true
    }));

    return libraryId;
  };
};

export const DeleteContentLibrary = ({ libraryId }) => {
  return async (dispatch) => {
    await Fabric.DeleteContentLibrary({libraryId});

    dispatch(SetNotificationMessage({
      message: "Successfully deleted content library",
      redirect: true
    }));
  };
};

export const SetLibraryContentTypes = ({libraryId, typeIds=[]}) => {
  return async (dispatch) => {
    const currentTypeIds = Object.values(await Fabric.ListLibraryContentTypes({libraryId}))
      .map(type => type.id);

    const idsToAdd = typeIds.filter(id => !currentTypeIds.includes(id));

    if(idsToAdd.length > 0) {
      const contentTypes = Object.values(await Fabric.ContentTypes());
      for(const typeId of idsToAdd) {
        // When adding a content type, check for custom contract
        const type = contentTypes.find(type => type.id === typeId);
        const customContractAddress = type.meta.custom_contract && type.meta.custom_contract.address;
        await Fabric.AddLibraryContentType({libraryId, typeId, customContractAddress});
      }
    }

    const idsToRemove = currentTypeIds.filter(id => !typeIds.includes(id));

    for(const typeId of idsToRemove) {
      await Fabric.RemoveLibraryContentType({libraryId, typeId});
    }

    dispatch(SetNotificationMessage({
      message: "Successfully updated content library types",
      redirect: true
    }));
  };
};

export const GetContentLibraryGroup = async ({libraryId, groupAddress, type}) => {
  const {accessGroups} = await Fabric.ListContentLibraryGroups({libraryId, type, params: {filter: groupAddress}});

  return accessGroups[groupAddress];
};

export const UpdateContentLibraryGroup = ({libraryId, groupAddress, accessor, contributor, reviewer}) => {
  return async (dispatch) => {
    const options = { accessor, contributor, reviewer};

    await Promise.all(
      ["accessor", "contributor", "reviewer"].map(async type => {
        const accessGroup = await GetContentLibraryGroup({libraryId, groupAddress, type});

        if(!accessGroup && options[type]) {
          // Add group
          await Fabric.AddContentLibraryGroup({libraryId, address: groupAddress, groupType: type});
        } else if(accessGroup && !options[type]) {
          // Remove group
          await Fabric.RemoveContentLibraryGroup({libraryId, address: groupAddress, groupType: type});
        }
      })
    );

    dispatch(SetNotificationMessage({
      message: "Successfully added library group",
      redirect: true
    }));
  };
};

export const ListContentTypes = ({params}) => {
  return async (dispatch) => {
    const {types, count} = await WithCancel(
      params.cancelable,
      async () => await Fabric.ListContentTypes({params})
    );

    dispatch({
      type: ActionTypes.content.types.list,
      types,
      count
    });
  };
};

export const ListContentObjects = ({libraryId, params}) => {
  return async (dispatch) => {
    const {objects, count, cacheId} = await WithCancel(
      params.cancelable,
      async () => await Fabric.ListContentObjects({libraryId, params})
    );

    dispatch({
      type: ActionTypes.content.objects.list,
      libraryId,
      objects,
      count
    });

    dispatch(SetLibraryListingCacheId({libraryId, cacheId}));
  };
};

export const SetLibraryListingCacheId = ({libraryId, cacheId}) => {
  return ({
    type: ActionTypes.content.libraries.setListingCacheId,
    libraryId,
    cacheId
  });
};

export const ClearLibraryListingCacheId = ({libraryId}) => {
  return ({
    type: ActionTypes.content.libraries.invalidateListingCacheId,
    libraryId
  });
};


export const ClearAllLibraryListingCacheIds = () => {
  return ({
    type: ActionTypes.content.libraries.invalidateAllListingCacheIds
  });
};

export const GetContentObject = ({libraryId, objectId}) => {
  return async (dispatch) => {
    const object = await Fabric.GetContentObject({libraryId, objectId});

    dispatch({
      type: ActionTypes.content.objects.get,
      objectId: object.id,
      object
    });
  };
};

export const GetContentObjectVersions = ({libraryId, objectId}) => {
  return async (dispatch) => {
    const versions = await Fabric.GetContentObjectVersions({libraryId, objectId});

    dispatch({
      type: ActionTypes.content.objects.versions,
      objectId,
      versions
    });

    dispatch(
      GetContentObjectVersion({versionHash: versions[0].hash})
    );
  };
};

export const GetContentObjectVersion = ({versionHash}) => {
  return async (dispatch) => {
    const objectId = Fabric.utils.DecodeVersionHash(versionHash).objectId;
    const version = await Fabric.GetContentObjectVersion({versionHash});

    dispatch({
      type: ActionTypes.content.objects.version,
      objectId,
      versionHash,
      version
    });
  };
};

export const GetContentObjectPermissions = ({libraryId, objectId}) => {
  return async (dispatch) => {
    const permissions = await Fabric.GetContentObjectPermissions({libraryId, objectId});

    dispatch({
      type: ActionTypes.content.objects.permissions,
      objectId,
      permissions
    });
  };
};

const CollectMetadata = async ({libraryId, objectId, writeToken, schema, fields, callback}) => {
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
        metadata[entry.key] = ParseInputJson(fields[entry.key]);
        break;

      case "list":
        metadata[entry.key] = ToList(fields[entry.key]).filter(item => item);
        break;
      case "object":
        metadata[entry.key] = await CollectMetadata({
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
};

export const CreateFromContentTypeSchema = ({libraryId, type, metadata, accessCharge, schema, fields, callback}) => {
  return async (dispatch) => {
    let createResponse = await Fabric.CreateContentObject({
      libraryId,
      type,
      metadata
    });

    await Fabric.MergeMetadata({
      libraryId,
      objectId: createResponse.id,
      writeToken: createResponse.write_token,
      metadata: {
        ...ParseInputJson(metadata),
        ...(await CollectMetadata({
          libraryId,
          objectId: createResponse.id,
          writeToken: createResponse.write_token,
          schema,
          fields,
          callback
        })),
      }
    });

    await Fabric.FinalizeContentObject({
      libraryId,
      objectId: createResponse.id,
      writeToken: createResponse.write_token
    });

    if(accessCharge > 0) {
      await Fabric.SetAccessCharge({objectId: createResponse.id, accessCharge});
    }

    dispatch(ClearLibraryListingCacheId({libraryId}));

    dispatch(SetNotificationMessage({
      message: "Successfully created content",
      redirect: true
    }));
  };
};

export const UpdateFromContentTypeSchema = ({libraryId, objectId, metadata, accessCharge, schema, fields, callback}) => {
  return async (dispatch) => {
    await Fabric.EditAndFinalizeContentObject({
      libraryId,
      objectId,
      todo: async (writeToken) => {
        await Fabric.ReplaceMetadata({
          libraryId,
          objectId,
          writeToken,
          metadata: {
            ...ParseInputJson(metadata),
            ...(await CollectMetadata({libraryId, writeToken, schema, fields, callback}))
          }
        });
      }
    });

    if(await Fabric.IsNormalObject({objectId})) {
      await Fabric.SetAccessCharge({objectId: objectId, accessCharge});
    }

    dispatch(ClearLibraryListingCacheId({libraryId}));

    dispatch(SetNotificationMessage({
      message: "Successfully updated content",
      redirect: true
    }));
  };
};

export const PublishContentObject = ({objectId}) => {
  return async (dispatch) => {
    await Fabric.PublishContentObject({objectId});

    dispatch(SetNotificationMessage({
      message: "Successfully updated content object",
      redirect: true
    }));
  };
};

export const ReviewContentObject = ({libraryId, objectId, approve, note}) => {
  return async (dispatch) => {
    await Fabric.ReviewContentObject({libraryId, objectId, approve, note});

    const currentAccountAddress = await Fabric.CurrentAccountAddress();

    await Fabric.EditAndFinalizeContentObject({
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

    dispatch(SetNotificationMessage({
      message: "Successfully updated content object",
      redirect: true
    }));
  };
};

export const DeleteContentObject = ({ libraryId, objectId }) => {
  return async (dispatch) => {
    await Fabric.DeleteContentObject({libraryId, objectId});

    dispatch(ClearLibraryListingCacheId({libraryId}));

    dispatch(SetNotificationMessage({
      message: "Successfully deleted content object",
      redirect: true
    }));
  };
};

export const DeleteContentVersion = ({ libraryId, objectId, versionHash }) => {
  return async (dispatch) => {
    await Fabric.DeleteContentVersion({libraryId, objectId, versionHash});

    dispatch(SetNotificationMessage({
      message: "Successfully deleted content version",
      redirect: true
    }));
  };
};

export const UpdateContentObject = ({libraryId, objectId, name, description, type, metadata}) => {
  return async (dispatch) => {
    let contentDraft = await Fabric.EditContentObject({
      libraryId,
      objectId,
      options: {
        type
      }
    });

    metadata = ParseInputJson(metadata);
    metadata.name = name;
    metadata["eluv.description"] = description;

    await Fabric.ReplaceMetadata({
      libraryId,
      objectId,
      writeToken: contentDraft.write_token,
      metadata
    });

    await Fabric.FinalizeContentObject({
      libraryId,
      objectId,
      writeToken: contentDraft.write_token
    });

    dispatch(ClearLibraryListingCacheId({libraryId}));

    dispatch(SetNotificationMessage({
      message: "Successfully updated content object",
      redirect: true
    }));

    return objectId;
  };
};

export const CreateContentType = ({name, description, metadata, bitcode}) => {
  return async (dispatch) => {
    const objectId = await Fabric.CreateContentType({
      name,
      description,
      metadata: ParseInputJson(metadata),
      bitcode
    });

    dispatch(SetNotificationMessage({
      message: "Successfully created content type",
      redirect: true
    }));

    return objectId;
  };
};

export const UpdateContentType = ({libraryId, objectId, name, description, bitcode, metadata}) => {
  return async (dispatch) => {
    await Fabric.EditAndFinalizeContentObject({
      libraryId,
      objectId,
      todo: async (writeToken) => {
        metadata = ParseInputJson(metadata);
        metadata.name = name;
        metadata["eluv.description"] = description;

        await Fabric.ReplaceMetadata({
          libraryId,
          objectId,
          writeToken,
          metadata
        });

        if(bitcode) {
          const uploadResponse = await Fabric.UploadPart({
            libraryId,
            objectId,
            writeToken,
            file: bitcode,
            encrypted: false
          });

          await Fabric.ReplaceMetadata({
            libraryId,
            objectId,
            writeToken,
            metadataSubtree: "bitcode_part",
            metadata: uploadResponse.part.hash
          });
        }
      }
    });

    dispatch(SetNotificationMessage({
      message: "Successfully updated content type",
      redirect: true
    }));

    return objectId;
  };
};

export const ContentTypes = () => {
  return async (dispatch) => {
    dispatch({
      type: ActionTypes.content.types.all,
      types: await Fabric.ContentTypes()
    });
  };
};

export const UploadParts = ({libraryId, objectId, files, encrypt=false, callback}) => {
  return async (dispatch) => {
    let parts = {};
    const contentDraft = await Fabric.EditContentObject({libraryId, objectId});

    await Promise.all(Array.from(files).map(async file => {
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
          chunkSize: 2000000,
          callback: partCallback
        })
      ).part.hash;
    }));

    await Fabric.MergeMetadata({
      libraryId,
      objectId,
      writeToken: contentDraft.write_token,
      metadataSubtree: "eluv-fb.parts",
      metadata: parts
    });

    await Fabric.FinalizeContentObject({
      libraryId,
      objectId,
      writeToken: contentDraft.write_token
    });

    const partsText = files.length > 1 ? "parts" : "part";

    dispatch(SetNotificationMessage({
      message: "Successfully uploaded " + partsText,
      redirect: true
    }));
  };
};

export const DownloadPart = ({libraryId, objectId, versionHash, partHash, callback}) => {
  return async () => {
    callback({bytesFinished: 0, bytesTotal: 1});
    let chunks = [];
    await Fabric.DownloadPart({
      libraryId,
      objectId,
      versionHash,
      partHash,
      format: "arrayBuffer",
      chunked: true,
      chunkSize: 1000000,
      callback: ({bytesFinished, bytesTotal, chunk}) => {
        callback({bytesFinished, bytesTotal});
        chunks.push(chunk);
      }
    });

    return window.URL.createObjectURL(new Blob(chunks));
  };
};

export const UploadFiles = ({libraryId, objectId, path, fileList}) => {
  return async (dispatch) => {
    await Fabric.EditAndFinalizeContentObject({
      libraryId,
      objectId,
      todo: async (writeToken) => {
        const fileInfo = await FileInfo(path, fileList);

        await Fabric.UploadFiles({libraryId, objectId, writeToken, fileInfo});
      }
    });

    dispatch(SetNotificationMessage({
      message: "Successfully uploaded files"
    }));
  };
};

export const DownloadFile = ({libraryId, objectId, versionHash, filePath}) => {
  return async () => {
    let blob = await Fabric.DownloadFile({libraryId, objectId, versionHash, filePath});
    let url = window.URL.createObjectURL(blob);

    await DownloadFromUrl(url, Path.basename(filePath));
  };
};

export const FileUrl = ({libraryId, objectId, versionHash, filePath}) => {
  return async () => {
    return await Fabric.FileUrl({libraryId, objectId, versionHash, filePath});
  };
};

export const AddApp = ({libraryId, objectId, role, file}) => {
  return async (dispatch) => {
    await Fabric.EditAndFinalizeContentObject({
      libraryId,
      objectId,
      todo: async (writeToken) => {
        // Override given filename
        const fileName = `${role}App.html`;
        file[0].overrideName = fileName;

        const fileInfo = await FileInfo("/", file);

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
          metadataSubtree: `eluv.${role}App`,
          metadata: fileName
        });
      }
    });

    dispatch(SetNotificationMessage({
      message: "Successfully added " + role + " app",
      redirect: true
    }));
  };
};

export const RemoveApp = ({libraryId, objectId, role}) => {
  return async (dispatch) => {
    await Fabric.EditAndFinalizeContentObject({
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

    dispatch(SetNotificationMessage({
      message: "Successfully removed " + role + " app",
      redirect: true
    }));
  };
};
