import ActionTypes from "../actions/ActionTypes";

const ContentTypesReducer = (state = {}, action) => {
  switch (action.type) {
    case ActionTypes.request.contentTypes.completed.list.all:
      return {
        ...state,
        contentTypes: action.contentTypes
      };

    default:
      return {
        ...state,
        contentTypes: state.contentTypes || {}
      };
  }
};

export default ContentTypesReducer;
