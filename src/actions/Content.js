import ActionTypes from "./ActionTypes";
import Fabric from "../clients/Fabric";
import { SetNotificationMessage } from "./Notifications";
import { ParseInputJson } from "../utils/Input";
import {FormatAddress} from "../utils/Helpers";
import {ToList} from "../utils/TypeSchema";
import {DownloadFromUrl, FileInfo} from "../utils/Files";
import Path from "path";

export const ListContentLibraries = () => {
  return async (dispatch) => {
    let libraries = await Fabric.ListContentLibraries();

    // Exclude special content space library
    delete libraries[Fabric.contentSpaceLibraryId];

    dispatch({
      type: ActionTypes.content.libraries.list,
      libraries
    });
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

export const ListContentLibraryGroups = ({libraryId}) => {
  return async (dispatch) => {
    // Content space does not have groups
    if(libraryId === Fabric.contentSpaceLibraryId) { return; }

    const groups = await Fabric.GetContentLibraryGroups({libraryId});

    dispatch({
      type: ActionTypes.content.libraries.groups,
      libraryId,
      groups
    });
  };
};

export const CreateContentLibrary = ({name, description, publicMetadata, privateMetadata, image}) => {
  return async (dispatch) => {
    const libraryId = await Fabric.CreateContentLibrary({
      name,
      description,
      publicMetadata: ParseInputJson(publicMetadata),
      privateMetadata: ParseInputJson(privateMetadata)
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
  publicMetadata,
  privateMetadata,
  image
}) => {
  return async (dispatch) => {
    publicMetadata = ParseInputJson(publicMetadata);
    publicMetadata["eluv.name"] = name;
    publicMetadata["eluv.description"] = description;

    await Fabric.ReplacePublicLibraryMetadata({
      libraryId,
      metadata: publicMetadata
    });

    const libraryObjectId = libraryId.replace("ilib", "iq__");
    await Fabric.EditAndFinalizeContentObject({
      libraryId,
      objectId: libraryObjectId,
      todo: async (writeToken) => {
        await Fabric.ReplaceMetadata({
          libraryId,
          objectId: libraryObjectId,
          writeToken,
          metadata: ParseInputJson(privateMetadata)
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
      const contentTypes = Object.values(await Fabric.ListContentTypes({}));
      for (const typeId of idsToAdd) {
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

export const UpdateContentLibraryGroups = ({libraryId, groups, originalGroups}) => {
  return async (dispatch) => {
    for(const groupType of Object.keys(groups)) {
      const oldGroupAddresses = originalGroups[groupType].map(group => FormatAddress(group.address));
      const newGroupAddresses = groups[groupType].map(group => FormatAddress(group.address));

      // Remove groups in original groups but not in new groups
      const toRemove = oldGroupAddresses.filter(address => !newGroupAddresses.includes(address));
      for(const address of toRemove) {
        await Fabric.RemoveContentLibraryGroup({libraryId, address, groupType});
      }

      // Add groups in new groups but not in original groups
      const toAdd = newGroupAddresses.filter(address => !oldGroupAddresses.includes(address));
      for(const address of toAdd) {
        await Fabric.AddContentLibraryGroup({libraryId, address, groupType});
      }
    }

    dispatch(SetNotificationMessage({
      message: "Successfully updated library groups",
      redirect: true
    }));
  };
};

export const ListContentObjects = ({libraryId}) => {
  return async (dispatch) => {
    const objects = await Fabric.ListContentObjects({libraryId});

    dispatch({
      type: ActionTypes.content.objects.list,
      objects
    });
  };
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
  };
};

export const GetContentObjectPermissions = async ({libraryId, objectId}) => {
  return await Fabric.GetContentObjectPermissions({libraryId, objectId});
};

export const PublishContentObject = async ({objectId}) => {
  return await Fabric.PublishContentObject({objectId});
};

export const ReviewContentObject = async ({libraryId, objectId, approve, note}) => {
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
};

export const CreateContentObject = ({libraryId, name, description, type, metadata}) => {
  return async (dispatch) => {
    metadata = ParseInputJson(metadata);
    metadata["eluv.name"] = name;
    metadata["eluv.description"] = description;

    const objectInfo = await Fabric.CreateAndFinalizeContentObject({
      libraryId,
      type,
      metadata,
    });

    dispatch(SetNotificationMessage({
      message: "Successfully created content object",
      redirect: true
    }));

    return objectInfo.id;
  };
};

export const DeleteContentObject = ({ libraryId, objectId }) => {
  return async (dispatch) => {
    await Fabric.DeleteContentObject({libraryId, objectId});

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
    metadata["eluv.name"] = name;
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

    dispatch(SetNotificationMessage({
      message: "Successfully updated content object",
      redirect: true
    }));
  };
};

export const CreateContentType = ({name, description, metadata, bitcode}) => {
  return async (dispatch) => {
    bitcode = await new Response(bitcode).blob();

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

export const ListContentTypes = ({latestOnly=true}) => {
  return async (dispatch) => {
    dispatch({
      type: ActionTypes.content.types.list,
      types: await Fabric.ListContentTypes({latestOnly})
    });
  };
};

export const GetContentType = ({versionHash}) => {
  return async (dispatch) => {
    dispatch({
      type: ActionTypes.content.types.get,
      contentType: await Fabric.GetContentType({versionHash})
    });
  };
};

export const UploadParts = ({libraryId, objectId, files, callback, encrypt}) => {
  return async (dispatch) => {
    let contentDraft = await Fabric.EditContentObject({libraryId, objectId});

    await Promise.all(Array.from(files).map(async file => {
      const data = await new Response(file).blob();

      let partCallback;
      if(callback) {
        partCallback = ({uploaded, total}) => callback({uploaded, total, filename: file.name});
      }

      await Fabric.UploadPart({
        libraryId,
        objectId,
        writeToken: contentDraft.write_token,
        data,
        chunkSize: 10000000,
        callback: partCallback,
        encrypted: encrypt
      });
    }));

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
  return async (dispatch) => {
    let blob = await Fabric.DownloadPart({libraryId, objectId, versionHash, partHash, encrypted: false});
    let url = window.URL.createObjectURL(blob);

    await callback(url);
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
  return async (dispatch) => {
    let blob = await Fabric.DownloadFile({libraryId, objectId, versionHash, filePath});
    let url = window.URL.createObjectURL(blob);

    await DownloadFromUrl(url, Path.basename(filePath));
  };
};

export const FileUrl = ({libraryId, objectId, versionHash, filePath}) => {
  return async (dispatch) => {
    return await Fabric.FileUrl({libraryId, objectId, versionHash, filePath});
  };
};

const CollectMetadata = async ({libraryId, writeToken, schema, fields}) => {
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

        for (const file of files) {
          const data = await new Response(file).blob();

          partResponses.push(
            await Fabric.UploadPart({
              libraryId,
              writeToken,
              data,
              encrypted: !!(entry.encrypted)
            })
          );
        }

        if (entry.multiple) {
          metadata[entry.key] = partResponses.map(partResponse => partResponse.part.hash);
        } else {
          metadata[entry.key] = partResponses.length > 0 ? partResponses[0].part.hash : "";
        }

        break;

      case "json":
        metadata[entry.key] = ParseInputJson(fields[entry.key]);
        break;

      case "list":
        metadata[entry.key] = ToList(fields[entry.key]);
        break;
      case "object":
        metadata[entry.key] = await CollectMetadata({
          libraryId,
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

export const CreateFromContentTypeSchema = ({libraryId, type, metadata, accessCharge, schema, fields}) => {
  return async (dispatch) => {
    const createResponse = await Fabric.CreateAndFinalizeContentObject({
      libraryId,
      type,
      todo: async (writeToken) => {
        await Fabric.ReplaceMetadata({
          libraryId,
          writeToken,
          metadata: {
            ...ParseInputJson(metadata),
            ...(await CollectMetadata({libraryId, writeToken, schema, fields})),
          }
        });
      }
    });

    if(accessCharge > 0) {
      await Fabric.SetAccessCharge({objectId: createResponse.id, accessCharge});
    }

    dispatch(SetNotificationMessage({
      message: "Successfully created content",
      redirect: true
    }));
  };
};

export const UpdateFromContentTypeSchema = ({libraryId, objectId, metadata, accessCharge, schema, fields}) => {
  return async (dispatch) => {
    await Fabric.EditAndFinalizeContentObject({
      libraryId,
      objectId,
      todo: async (writeToken) => {
        await Fabric.ReplaceMetadata({
          libraryId,
          writeToken,
          metadata: {
            ...ParseInputJson(metadata),
            ...(await CollectMetadata({libraryId, writeToken, schema, fields}))
          }
        });
      }
    });

    await Fabric.SetAccessCharge({objectId: objectId, accessCharge});

    dispatch(SetNotificationMessage({
      message: "Successfully updated content",
      redirect: true
    }));
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
