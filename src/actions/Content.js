import ActionTypes from "./ActionTypes";
import Fabric from "../clients/Fabric";
import { SetNotificationMessage } from "./Notifications";
import ContentLibrary from "../models/ContentLibrary";
import ContentObject from "../models/ContentObject";
import { ParseInputJson } from "../utils/Input";

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
    const contentLibrary = new ContentLibrary({
      libraryId,
      libraryMetadata: ParseInputJson(publicMetadata)
    });

    contentLibrary.name = name;
    contentLibrary.description = description;

    await Fabric.ReplacePublicLibraryMetadata({
      libraryId,
      metadata: contentLibrary.FullMetadata()
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
      const oldGroupAddresses = originalGroups[groupType].map(group => Fabric.FormatAddress(group.address));
      const newGroupAddresses = groups[groupType].map(group => Fabric.FormatAddress(group.address));

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

export const CreateContentObject = ({libraryId, name, description, type, metadata}) => {
  return async (dispatch) => {
    const contentObject = new ContentObject({
      libraryId,
      contentObjectData: {meta: ParseInputJson(metadata)}
    });

    contentObject.name = name;
    contentObject.description = description;
    contentObject.type = type;

    await Fabric.CreateAndFinalizeContentObject({
      libraryId,
      type,
      metadata: contentObject.FullMetadata()
    });

    dispatch(SetNotificationMessage({
      message: "Successfully created content object",
      redirect: true
    }));
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
    const contentObject = new ContentObject({
      libraryId,
      contentObjectData: {meta: ParseInputJson(metadata)}
    });

    contentObject.name = name;
    contentObject.description = description;
    contentObject.type = type;

    let contentDraft = await Fabric.EditContentObject({ libraryId, objectId });

    await Fabric.ReplaceMetadata({
      libraryId,
      objectId,
      writeToken: contentDraft.write_token,
      metadata: ParseInputJson(contentObject.FullMetadata())
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

export const UploadParts = ({libraryId, objectId, files}) => {
  return async (dispatch) => {
    let contentDraft = await Fabric.EditContentObject({ libraryId, objectId });

    for(const file of files) {
      const data = await new Response(file).blob();

      await Fabric.UploadPart({
        libraryId,
        objectId,
        writeToken: contentDraft.write_token,
        data
      });
    }

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
    let blob = await Fabric.DownloadPart({ libraryId, objectId, versionHash, partHash, format: "blob" });
    let url = window.URL.createObjectURL(blob);

    callback(url);
  };
};
