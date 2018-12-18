import { combineReducers } from "redux";

import AccountsReducer from "./AccountsReducer";
import ContentReducer from "./ContentReducer";
import ContractsReducer from "./ContractsReducer";
import NotificationsReducer from "./NotificationsReducer";
import RequestsReducer from "./RequestsReducer";
import AccessGroupsReducer from "./AccessGroupsReducer";
import CreateRoutingReducer from "./RoutingReducer";

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

export default (history) => {
  return combineReducers({
    router: CreateRoutingReducer(history),
    accessGroups: AccessGroupsReducer,
    accounts: AccountsReducer,
    content: ContentReducer,
    contracts: ContractsReducer,
    notifications: NotificationsReducer,
    requests: RequestsReducer
  });
};
