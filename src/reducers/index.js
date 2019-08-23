import { combineReducers } from "redux";
import {connectRouter} from "connected-react-router";

import ContentReducer from "./ContentReducer";
import ContractsReducer from "./ContractsReducer";
import NotificationsReducer from "./NotificationsReducer";
import AccessGroupsReducer from "./AccessGroupsReducer";
import FrameRoutingReducer from "./FrameRoutingReducer";
import LogsReducer from "./LogsReducer";

/*
// Collect all dispatched actions
const DebugReducer = (state = {}, action) => {
  let actions = state.actions || [];
  const actionRecord = {
    type: action.type,
    attrs: Object.keys(action)
  };
  actions.push(actionRecord);
  return {
    ...state,
    actions
  };
};
*/

export default (history) => {
  return combineReducers({
    router: connectRouter(history),
    frameRouting: FrameRoutingReducer,
    accessGroups: AccessGroupsReducer,
    content: ContentReducer,
    contracts: ContractsReducer,
    notifications: NotificationsReducer,
    logs: LogsReducer,
  });
};
