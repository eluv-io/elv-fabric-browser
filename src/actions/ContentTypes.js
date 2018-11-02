import ActionTypes from "./ActionTypes";
import Fabric from "../clients/Fabric";
import { SetNotificationMessage } from "./Notifications";
import { WrapRequest } from "./Requests";

export const ListContentTypes = () => {
  return (dispatch) => {
    return WrapRequest({
      dispatch: dispatch,
      domain: "content",
      action: "listContentTypes",
      todo: (async () => {
        /*
          let libraryIds = await Fabric.ListContentLibraries();

          let result = await ParseContentLibraries({libraryIds: libraryIds});

          dispatch({
            type: ActionTypes.request.content.completed.list.all,
            contentLibraries: result.contentLibraries
          });
        */
      })
    });
  };
};
