import ActionTypes from "./ActionTypes";
import Fabric from "../clients/Fabric";
import { SetNotificationMessage } from "./Notifications";
import ContentLibrary from "../models/ContentLibrary";
import ContentObject from "../models/ContentObject";
import {Wait} from "../utils/Helpers";
import { ParseInputJson } from "../utils/Input";

export const ListContentLibraries = () => {
  return async (dispatch) => {
    let libraryIds = await Fabric.ListContentLibraries();

    // Exclude special content space library
    libraryIds = libraryIds.filter(libraryId => libraryId !== Fabric.contentSpaceLibraryId);

    // Query libraries one at a time to avoid blockchain nonce collisions and cache access transactions
    const libraryMetadata = {};
    for(const libraryId of libraryIds) {
      libraryMetadata[libraryId] = (await Fabric.GetContentLibrary({libraryId})).meta;
    }

    let contentLibraries = {};
    await Promise.all(
      libraryIds.map(async libraryId => {
        try {
          // Query for content objects
          const contentObjects = (await Fabric.ListContentObjects({libraryId})).contents;
          const libraryOwner = await Fabric.GetContentLibraryOwner({libraryId});

          contentLibraries[libraryId] = new ContentLibrary({
            libraryId,
            owner: libraryOwner,
            libraryMetadata: libraryMetadata[libraryId],
            contentObjectsData: contentObjects
          });
        } catch(error) {
          console.error("Error querying library: \n" + JSON.stringify(error, null, 2));
        }
      })
    );

    dispatch({
      type: ActionTypes.request.content.completed.list.all,
      contentLibraries
    });
  };
};

export const GetContentLibrary = ({libraryId}) => {
  return async (dispatch) => {
    const libraryData = await Fabric.GetContentLibrary({libraryId});
    const owner = await Fabric.GetContentLibraryOwner({libraryId});

    let libraryGroups = {};
    if(libraryId !== Fabric.contentSpaceLibraryId) {
      libraryGroups = await Fabric.GetContentLibraryGroups({libraryId});
    }

    dispatch({
      type: ActionTypes.request.content.completed.list.library,
      libraryId: libraryId,
      contentLibrary: new ContentLibrary({
        libraryId,
        owner,
        groups: libraryGroups,
        libraryMetadata: libraryData.meta,
        url: libraryData.url
      })
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
  libraryObjectId,
  name,
  description,
  contractAddress,
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
    contentLibrary.contractAddress = contractAddress;

    await Fabric.ReplacePublicLibraryMetadata({
      libraryId,
      metadata: contentLibrary.FullMetadata()
    });

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

export const ListContentObjects = ({ libraryId }) => {
  return async (dispatch) => {
    const libraryData = (await Fabric.GetContentLibrary({libraryId}));
    const contentObjectsData = await Fabric.ListContentObjects({libraryId});
    const libraryOwner = await Fabric.GetContentLibraryOwner({libraryId});

    let libraryGroups = {};
    if(libraryId !== Fabric.contentSpaceLibraryId) {
      libraryGroups = await Fabric.GetContentLibraryGroups({libraryId});
    }

    dispatch({
      type: ActionTypes.request.content.completed.list.library,
      libraryId: libraryId,
      contentLibrary: new ContentLibrary({
        libraryId,
        owner: libraryOwner,
        libraryMetadata: libraryData.meta,
        contentObjectsData: contentObjectsData.contents,
        url: libraryData.url,
        groups: libraryGroups
      })
    });
  };
};

export const GetFullContentObject = ({ libraryId, objectId, includeStatus=true }) => {
  return async (dispatch) => {
    let contentObject = await Fabric.GetFullContentObject({ libraryId, objectId, includeStatus });

    dispatch({
      type: ActionTypes.request.content.completed.list.contentObject,
      libraryId: libraryId,
      contentObject
    });
  };
};

export const GetContentObjectMetadata = ({ libraryId, objectId }) => {
  return async (dispatch) => {
    let contentObjectData = await Fabric.GetContentObject({ libraryId, objectId });
    contentObjectData.meta = await Fabric.GetContentObjectMetadata({ libraryId, objectId });

    const owner = await Fabric.GetContentObjectOwner({objectId});

    const contentObject = new ContentObject({libraryId, owner, contentObjectData});
    dispatch({
      type: ActionTypes.request.content.completed.list.contentObject,
      libraryId: libraryId,
      contentObject
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

export const UpdateContentObject = ({libraryId, objectId, name, description, type, contractAddress, metadata}) => {
  return async (dispatch) => {
    const contentObject = new ContentObject({
      libraryId,
      contentObjectData: {meta: ParseInputJson(metadata)}
    });

    contentObject.name = name;
    contentObject.description = description;
    contentObject.type = type;
    contentObject.contractAddress = contractAddress;

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

export const UploadParts2 = ({libraryId, objectId, files}) => {
  return async (dispatch) => {
    let contentDraft = await Fabric.EditContentObject({ libraryId, objectId });

    const fileInfo = Array.from(files).map(file => {
      return (
        {
          name: file.name,
          description: "test description",
          path: file.name,
          size: file.size,
          type: "file",
          security_groups: [],
          mime_type: "text/plain"
        }
      );
    });

    console.log(JSON.stringify(fileInfo, null, 2));

    const uploadJob = (await Fabric.CreateFileUploadJob({
      libraryId,
      writeToken: contentDraft.write_token,
      fileInfo
    })).upload_jobs[0];

    console.log("created upload job");

    await Wait(5000);

    await Promise.all(
      Array.from(files).reverse().map(async (file) => {
        console.log("uploading file " + file.name);
        const fileData = await new Response(file).blob();
        await Fabric.UploadFileData({
          libraryId,
          writeToken: contentDraft.write_token,
          jobId: uploadJob.id,
          fileData
        });
      })
    );

    console.log("Getting status");
    while(true) {
      let statusResponse = (await Fabric.GetUploadJobStatus({
        libraryId,
        objectId,
        writeToken: contentDraft.write_token,
        jobId: uploadJob.id
      })).upload_jobs[0];

      console.log(JSON.stringify(statusResponse, null, 2));

      const complete = !statusResponse.files.some(fileInfo => {
        return fileInfo.rem !== 0;
      });

      if(complete) {
        break;
      }
      console.log("waiting");
      await Wait(2000);
    }

    await Fabric.FinalizeUploadJobs({
      libraryId,
      objectId,
      writeToken: contentDraft.write_token
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
  return async (dispatch) => {
    let blob = await Fabric.DownloadPart({ libraryId, objectId, versionHash, partHash, format: "blob" });
    let url = window.URL.createObjectURL(blob);

    callback(url);
  };
};
