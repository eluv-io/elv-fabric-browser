import ActionTypes from "./ActionTypes";
import Fabric from "../clients/Fabric";
import { SetNotificationMessage } from "./Notifications";
import { ParseInputJson } from "../utils/Input";
import {FormatAddress} from "../utils/Helpers";

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
      todo: async ({writeToken}) => {
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
    todo: async ({writeToken}) => {
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

export const ListContentTypes = () => {
  return async (dispatch) => {
    dispatch({
      type: ActionTypes.content.types.list,
      types: await Fabric.ListContentTypes()
    });
  };
};

export const UploadParts = ({libraryId, objectId, files, encrypt}) => {
  return async (dispatch) => {
    let contentDraft = await Fabric.EditContentObject({ libraryId, objectId });

    await Promise.all(Array.from(files).map(async file => {
      const data = await new Response(file).blob();

      await Fabric.UploadPart({
        libraryId,
        objectId,
        writeToken: contentDraft.write_token,
        data,
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
    let blob = await Fabric.DownloadPart({libraryId, objectId, versionHash, partHash});
    let url = window.URL.createObjectURL(blob);

    callback(url);
  };
};

const CollectMetadata = ({schema, fields}) => {
  let metadata = {};

  schema.main.map(async fieldName => {
    const fieldSchema = schema.fields[fieldName];
    const fieldValue = fields[fieldName];

    switch(fieldSchema.type) {
      case "file":
        break;

      case "json":
        metadata[fieldName] = ParseInputJson(fieldValue);
        break;

      default:
        metadata[fieldName] = fieldValue;
    }
  });

  return metadata;
};

const CollectFiles = async ({libraryId, writeToken, schema, fields}) => {
  const fileFields = schema.main.filter(fieldName => schema.fields[fieldName].type === "file");
  let fileMetadata = {};

  if (fileFields.length > 0) {
    for (const fieldName of fileFields) {
      let partResponses = [];
      for (const file of Array.from(fields[fieldName])) {
        const data = await new Response(file).blob();

        partResponses.push(
          await Fabric.UploadPart({
            libraryId,
            writeToken,
            data,
            encrypted: !!(schema.fields[fieldName].encrypt)
          })
        );
      }

      if (schema.fields[fieldName].multiple) {
        fileMetadata[fieldName] = partResponses.map(partResponse => partResponse.part.hash);
      } else {
        fileMetadata[fieldName] = partResponses.length > 0 ? partResponses[0].part.hash : "";
      }
    }
  }

  return fileMetadata;
};

export const CreateFromContentTypeSchema = ({libraryId, type, metadata, schema, fields}) => {
  return async (dispatch) => {
    await Fabric.CreateAndFinalizeContentObject({
      libraryId,
      type,
      todo: async ({writeToken}) => {
        await Fabric.ReplaceMetadata({
          libraryId,
          writeToken,
          metadata: {
            ...ParseInputJson(metadata),
            ...(CollectMetadata({schema, fields})),
            ...(await CollectFiles({libraryId, writeToken, schema, fields}))
          }
        });
      }
    });

    dispatch(SetNotificationMessage({
      message: "Successfully created content",
      redirect: true
    }));
  };
};

export const UpdateFromContentTypeSchema = ({libraryId, objectId, metadata, schema, fields}) => {
  return async (dispatch) => {
    await Fabric.EditAndFinalizeContentObject({
      libraryId,
      objectId,
      todo: async ({writeToken}) => {
        await Fabric.ReplaceMetadata({
          libraryId,
          writeToken,
          metadata: {
            ...ParseInputJson(metadata),
            ...(CollectMetadata({schema, fields})),
            ...(await CollectFiles({libraryId, writeToken, schema, fields}))
          }
        });
      }
    });

    dispatch(SetNotificationMessage({
      message: "Successfully updated content",
      redirect: true
    }));
  };
};
