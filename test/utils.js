import ActionTypes from "../src/actions/ActionTypes";
import {Wait} from "../src/utils/Helpers";

export const AwaitRequest = async ({ store, requestId }) => {
  let condition = true;
  while(condition) {
    for (const action of store.getActions()) {
      if (action.requestId === requestId) {
        if (action.type === ActionTypes.request.request.status.error) {
          return false;
        }

        if (action.type === ActionTypes.request.request.status.completed) {
          return true;
        }
      }
    }

    await Wait(250);
  }
};
