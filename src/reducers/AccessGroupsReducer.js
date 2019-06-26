import ActionTypes from "../actions/ActionTypes";

const AccessGroupsReducer = (state = {}, action) => {
  switch(action.type) {
    case ActionTypes.accessGroups.list:
      return {
        ...state,
        accessGroups: action.accessGroups,
        count: {
          ...state.count,
          accessGroups: action.count
        }
      };

    case ActionTypes.accessGroups.get:
      return {
        ...state,
        accessGroups: {
          ...state.accessGroups,
          [action.contractAddress]: action.accessGroup
        }
      };

    case ActionTypes.accessGroups.members.list:
      return {
        ...state,
        accessGroups: {
          ...state.accessGroups,
          [action.contractAddress]: {
            ...state.accessGroups[action.contractAddress],
            members: action.members
          }
        },
        count: {
          ...state.count,
          members: {
            ...state.count.members,
            [action.contractAddress]: action.count
          }
        }
      };

    default:
      return {
        ...state,
        accessGroups: state.accessGroups || {},
        count: state.count || {accessGroups: 0, members: {}}
      };
  }
};

export default AccessGroupsReducer;
