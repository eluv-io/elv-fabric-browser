import ActionTypes from "../actions/ActionTypes";

const AccessGroupsReducer = (state = {}, action) => {
  const newState = {
    ...state,
    accessGroups: state.accessGroups || {},
    accessGroupMembers: state.accessGroupMembers || {},
    count: state.count || {accessGroups: 0, accessGroupMembers: {}}
  };

  switch(action.type) {
    case ActionTypes.accessGroups.list:
      newState.accessGroups = action.accessGroups;
      newState.count.accessGroups = action.count;
      break;

    case ActionTypes.accessGroups.get:
      newState.accessGroups[action.contractAddress] = action.accessGroup;
      break;

    case ActionTypes.accessGroups.members.list:
      newState.accessGroupMembers[action.contractAddress] = action.members;
      newState.count.accessGroupMembers[action.contractAddress] = action.count;
      break;
  }

  return newState;
};

export default AccessGroupsReducer;
