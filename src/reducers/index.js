import { combineReducers } from "redux";

import AccountsReducer from "./AccountsReducer";
import ContentReducer from "./ContentReducer";
import ContentTypesReducer from "./ContentTypesReducer";
import ContractsReducer from "./ContractsReducer";
import NotificationsReducer from "./NotificationsReducer";
import RequestsReducer from "./RequestsReducer";
import AccessGroupsReducer from "./AccessGroupsReducer";

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

export default combineReducers({
  accessGroups: AccessGroupsReducer,
  accounts: AccountsReducer,
  content: ContentReducer,
  contentTypes: ContentTypesReducer,
  contracts: ContractsReducer,
  notifications: NotificationsReducer,
  requests: RequestsReducer,
  debug: DebugReducer
});
