import ActionTypes from "../actions/ActionTypes";

const AccessGroupsReducer = (state = {}, action) => {
  switch (action.type) {
    case ActionTypes.accessGroups.list:
      return {
        ...state,
        accessGroups: action.accessGroups
      };

    default:
      return {
        ...state,
        accessGroups: state.accessGroups || {}
      };
  }
};

export default AccessGroupsReducer;
