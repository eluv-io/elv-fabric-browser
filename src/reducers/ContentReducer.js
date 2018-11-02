import ActionTypes from "../actions/ActionTypes";

const ContentReducer = (state = {}, action) => {
  switch (action.type) {
    case ActionTypes.request.content.completed.list.all:
      return {
        ...state,
        contentLibraries: action.contentLibraries
      };

    case ActionTypes.request.content.completed.list.library:
      return {
        ...state,
        contentLibraries: {
          ...state.contentLibraries,
          [action.libraryId]: action.contentLibrary
        }
      };

    case ActionTypes.request.content.completed.list.contentObject:
      return {
        ...state,
        contentObjects: {
          ...state.contentObjects,
          [action.contentObject.objectId]: action.contentObject
        }
      };

    case ActionTypes.request.content.completed.list.contentObjectMetadata:
      return {
        ...state,
        contentObjectMetadata: {
          ...state.contentObjectMetadata,
          [action.contentObject.objectId]: action.contentObject
        }
      };

    default:
      return {
        ...state,
        contentLibraries: state.contentLibraries || {},
        contentObjects: state.contentObjects || {},
        contentObjectMetadata: state.contentObjectMetadata || {}
      };
  }
};

export default ContentReducer;
