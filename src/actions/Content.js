import ActionTypes from "./ActionTypes";
import Fabric from "../clients/Fabric";
import { SetNotificationMessage } from "./Notifications";
import { WrapRequest } from "./Requests";
import ContentLibrary from "../models/ContentLibrary";
import ContentObject from "../models/ContentObject";
import {Wait} from "../utils/Helpers";
import { ParseInputJson } from "../utils/Input";

export const ListContentLibraries = () => {
  return (dispatch) => {
    return WrapRequest({
      dispatch: dispatch,
      action: "listContentLibraries",
      todo: (async () => {
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

              contentLibraries[libraryId] = new ContentLibrary({
                libraryId,
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
      })
    });
  };
};

export const GetContentLibrary = ({libraryId}) => {
  return (dispatch) => {
    return WrapRequest({
      dispatch: dispatch,
      action: "getContentLibrary",
      todo: (async () => {
        const libraryData = await Fabric.GetContentLibrary({libraryId});

        dispatch({
          type: ActionTypes.request.content.completed.list.library,
          libraryId: libraryId,
          contentLibrary: new ContentLibrary({
            libraryId,
            libraryMetadata: libraryData.meta,
            url: libraryData.url
          })
        });
      })
    });
  };
};

export const CreateContentLibrary = ({name, description, publicMetadata, privateMetadata, image}) => {
  return (dispatch) => {
    return WrapRequest({
      dispatch: dispatch,
      action: "createContentLibrary",
      todo: (async () => {
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
      })
    });
  };
};

export const UpdateContentLibrary = ({libraryId, name, description, contractAddress, publicMetadata, image}) => {
  return (dispatch) => {
    return WrapRequest({
      dispatch: dispatch,
      action: "createContentLibrary",
      todo: (async () => {
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
      })
    });
  };
};

export const DeleteContentLibrary = ({ libraryId }) => {
  return (dispatch) => {
    return WrapRequest({
      dispatch: dispatch,
      action: "deleteContentLibrary",
      todo: (async () => {
        await Fabric.DeleteContentLibrary({libraryId});

        dispatch(SetNotificationMessage({
          message: "Successfully deleted content library",
          redirect: true
        }));
      })
    });
  };
};

export const ListContentObjects = ({ libraryId }) => {
  return (dispatch) => {
    return WrapRequest({
      dispatch: dispatch,
      action: "listContentObjects",
      todo: (async () => {
        let libraryData = (await Fabric.GetContentLibrary({libraryId}));
        let contentObjectsData = await Fabric.ListContentObjects({libraryId});

        dispatch({
          type: ActionTypes.request.content.completed.list.library,
          libraryId: libraryId,
          contentLibrary: new ContentLibrary({
            libraryId,
            libraryMetadata: libraryData.meta,
            contentObjectsData: contentObjectsData.contents,
            url: libraryData.url
          })
        });
      })
    });
  };
};

export const GetFullContentObject = ({ libraryId, objectId }) => {
  return (dispatch) => {
    return WrapRequest({
      dispatch: dispatch,
      action: "getFullContentObject",
      todo: (async () => {
        let contentObject = await Fabric.GetFullContentObject({ libraryId, objectId });

        dispatch({
          type: ActionTypes.request.content.completed.list.contentObject,
          libraryId: libraryId,
          contentObject
        });
      })
    });
  };
};

export const GetContentObjectMetadata = ({ libraryId, objectId }) => {
  return (dispatch) => {
    return WrapRequest({
      dispatch: dispatch,
      action: "getContentObjectMetadata",
      todo: (async () => {
        let contentObjectData = await Fabric.GetContentObject({ libraryId, objectId });
        contentObjectData.meta = await Fabric.GetContentObjectMetadata({ libraryId, objectId });

        let contentObject = new ContentObject({libraryId, contentObjectData});
        dispatch({
          type: ActionTypes.request.content.completed.list.contentObject,
          libraryId: libraryId,
          contentObject
        });
      })
    });
  };
};

export const CreateContentObject = ({libraryId, name, description, type, metadata}) => {
  return (dispatch) => {
    return WrapRequest({
      dispatch: dispatch,
      action: "createContentObject",
      todo: (async () => {
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
      })
    });
  };
};

export const DeleteContentObject = ({ libraryId, objectId }) => {
  return (dispatch) => {
    return WrapRequest({
      dispatch: dispatch,
      action: "deleteContentObject",
      todo: (async () => {
        await Fabric.DeleteContentObject({libraryId, objectId});

        dispatch(SetNotificationMessage({
          message: "Successfully deleted content object",
          redirect: true
        }));
      })
    });
  };
};

export const DeleteContentVersion = ({ libraryId, objectId, versionHash }) => {
  return (dispatch) => {
    return WrapRequest({
      dispatch: dispatch,
      action: "deleteContentObject",
      todo: (async () => {
        await Fabric.DeleteContentVersion({libraryId, objectId, versionHash});

        dispatch(SetNotificationMessage({
          message: "Successfully deleted content version",
          redirect: true
        }));
      })
    });
  };
};

export const UpdateContentObject = ({libraryId, objectId, name, description, type, contractAddress, metadata}) => {
  return (dispatch) => {
    return WrapRequest({
      dispatch: dispatch,
      action: "updateContentObject",
      todo: (async () => {
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
      })
    });
  };
};

export const UploadParts = ({libraryId, objectId, files}) => {
  return (dispatch) => {
    return WrapRequest({
      dispatch: dispatch,
      action: "uploadParts",
      todo: (async () => {
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
      })
    });
  };
};

export const UploadParts2 = ({libraryId, objectId, files}) => {
  return (dispatch) => {
    return WrapRequest({
      dispatch: dispatch,
      action: "uploadParts",
      todo: (async () => {
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
      })
    });
  };
};

export const DownloadPart = ({libraryId, objectId, versionHash, partHash, callback}) => {
  return (dispatch) => {
    return WrapRequest({
      dispatch: dispatch,
      action: "downloadPart",
      todo: (async () => {
        let blob = await Fabric.DownloadPart({ libraryId, objectId, versionHash, partHash, format: "blob" });
        let url = window.URL.createObjectURL(blob);

        callback(url);
      })
    });
  };
};
