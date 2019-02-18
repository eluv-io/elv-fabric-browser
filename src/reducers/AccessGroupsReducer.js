import ActionTypes from "../actions/ActionTypes";

const AccessGroupsReducer = (state = {}, action) => {
  switch (action.type) {
    case ActionTypes.accessGroups.list:
      return {
        ...state,
        accessGroups: action.accessGroups,
        count: action.count
      };

    case ActionTypes.accessGroups.get:
      return {
        ...state,
        accessGroups: {
          ...state.accessGroups,
          [action.contractAddress]: action.accessGroup
        }
      };

    default:
      return {
        ...state,
        accessGroups: state.accessGroups || {},
        count: state.count || 0
      };
  }
};

export default AccessGroupsReducer;
