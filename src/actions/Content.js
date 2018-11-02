import ActionTypes from "./ActionTypes";
import Fabric from "../clients/Fabric";
import { SetNotificationMessage } from "./Notifications";
import { WrapRequest } from "./Requests";
import ContentLibrary from "../models/ContentLibrary";
import ContentObject from "../models/ContentObject";
import {Wait} from "../utils/Helpers";

export const ListContentLibraries = () => {
  return (dispatch) => {
    return WrapRequest({
      dispatch: dispatch,
      domain: "content",
      action: "listContentLibraries",
      todo: (async () => {
        let libraryIds = await Fabric.ListContentLibraries();

        let contentLibraries = {};
        await Promise.all(
          libraryIds.map(async libraryId => {
            try {
              let libraryMetadata = (await Fabric.GetContentLibrary({libraryId})).meta;
              // Query for content objects
              let contentObjects = (await Fabric.ListContentObjects({libraryId})).contents;

              contentLibraries[libraryId] = new ContentLibrary({
                libraryId,
                libraryMetadata,
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

export const ListContentObjects = ({ libraryId }) => {
  return (dispatch) => {
    return WrapRequest({
      dispatch: dispatch,
      domain: "content",
      action: "listContentObjects",
      todo: (async () => {
        let libraryData = (await Fabric.GetContentLibrary({libraryId}));
        let contentObjectsData = await Fabric.ListContentObjects({libraryId});

        console.log(libraryData);

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
      domain: "content",
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
      domain: "content",
      action: "getContentObjectMetadata",
      todo: (async () => {
        let contentObjectData = await Fabric.GetContentObject({ libraryId, objectId });
        contentObjectData.meta = await Fabric.GetContentObjectMetadata({ libraryId, contentHash: objectId });

        let contentObject = new ContentObject({libraryId, contentObjectData});

        dispatch({
          type: ActionTypes.request.content.completed.list.contentObjectMetadata,
          libraryId: libraryId,
          contentObject
        });
      })
    });
  };
};

export const CreateContentObject = ({libraryId, name, type, metadata}) => {
  return (dispatch) => {
    return WrapRequest({
      dispatch: dispatch,
      domain: "content",
      action: "createContentObject",
      todo: (async () => {
        let parsedMetadata = metadata;
        if(typeof metadata === "string" && metadata !== "") {
          try {
            parsedMetadata = JSON.parse(metadata);
          } catch(error) {
            throw Error("Invalid JSON");
          }
        }

        await Fabric.CreateAndFinalizeContentObject({
          libraryId,
          name: name,
          type: type,
          metadata: parsedMetadata
        });

        dispatch(SetNotificationMessage({
          message: "Successfully created content object",
          redirect: true
        }));
      })
    });
  };
};

export const UpdateContentObject = ({libraryId, objectId, metadata}) => {
  return (dispatch) => {
    return WrapRequest({
      dispatch: dispatch,
      domain: "content",
      action: "updateContentObject",
      todo: (async () => {
        let contentDraft = await Fabric.EditContentObject({ libraryId, objectId });

        let parsedMetadata = metadata;
        if(typeof metadata === "string") {
          try {
            parsedMetadata = JSON.parse(metadata);
          } catch(error) {
            throw Error("Invalid JSON");
          }
        }

        await Fabric.ReplaceMetadata({
          libraryId,
          writeToken: contentDraft.write_token,
          metadata: parsedMetadata
        });

        await Fabric.FinalizeContentObject({
          libraryId,
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
      domain: "content",
      action: "uploadParts",
      todo: (async () => {
        let contentDraft = await Fabric.EditContentObject({ libraryId, objectId });

        for(const file of files) {
          const data = await new Response(file).blob();

          await Fabric.UploadPart({
            libraryId,
            writeToken: contentDraft.write_token,
            data
          });
        }

        await Fabric.FinalizeContentObject({
          libraryId,
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
      domain: "content",
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
          writeToken: contentDraft.write_token
        });

        await Fabric.FinalizeContentObject({
          libraryId,
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

export const DownloadPart = ({libraryId, contentHash, partHash, callback}) => {
  return (dispatch) => {
    return WrapRequest({
      dispatch: dispatch,
      domain: "content",
      action: "getContentObject",
      todo: (async () => {
        let blob = await Fabric.DownloadPart({ libraryId, contentHash, partHash, format: "blob" });
        let url = window.URL.createObjectURL(blob);

        callback(url);
      })
    });
  };
};

export const CreateContentLibrary = ({name, description}) => {
  return (dispatch) => {
    return WrapRequest({
      dispatch: dispatch,
      domain: "content",
      action: "createContentLibrary",
      todo: (async () => {
        let libraryId = await Fabric.CreateContentLibrary({
          libraryName: name,
          libraryDescription: description
        });

        dispatch(SetNotificationMessage({
          message: "Successfully created content library '" + libraryId + "'",
          redirect: true
        }));
      })
    });
  };
};
