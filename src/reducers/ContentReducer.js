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

    case ActionTypes.request.content.completed.list.contentObjectEvents:
      return {
        ...state,
        contentObjectEvents: {
          ...state.contentObjectEvents,
          [action.contractAddress]: action.events
        }
      };

    case ActionTypes.request.content.completed.contract.call:
      return {
        ...state,
        contractMethodResults: {
          ...state.contractMethodResults,
          [action.contractAddress]: {
            ...state.contractMethodResults[action.contractAddress],
            [action.methodName]: action.result
          }
        }
      };

    default:
      return {
        ...state,
        contentLibraries: state.contentLibraries || {},
        contentObjects: state.contentObjects || {},
        contentObjectMetadata: state.contentObjectMetadata || {},
        contentObjectEvents: state.contentObjectEvents || {},
        contractMethodResults: state.contractMethodResults || {}
      };
  }
};

export default ContentReducer;
