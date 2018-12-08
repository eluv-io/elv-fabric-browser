import ActionTypes from "../actions/ActionTypes";

const ContentReducer = (state = {}, action) => {
  switch (action.type) {
    case ActionTypes.content.libraries.list:
      return {
        ...state,
        libraries: action.libraries
      };

    case ActionTypes.content.libraries.get:
      return {
        ...state,
        libraries: {
          ...state.libraries,
          [action.libraryId]: action.library
        }
      };

    case ActionTypes.content.libraries.groups:
      return {
        ...state,
        libraries: {
          ...state.libraries,
          [action.libraryId]: {
            ...state.libraries[action.libraryId],
            groups: action.groups
          }
        }
      };

    case ActionTypes.content.objects.list:
      return {
        ...state,
        objects: {
          ...state.objects,
          ...action.objects
        }
      };

    case ActionTypes.content.objects.get:
      return {
        ...state,
        objects: {
          ...state.objects,
          [action.objectId]: action.object
        }
      };

    case ActionTypes.content.objects.versions:
      return {
        ...state,
        objects: {
          ...state.objects,
          [action.objectId]: {
            ...state.objects[action.objectId],
            versions: action.versions
          }
        }
      };

    default:
      return {
        ...state,
        libraries: state.libraries || {},
        objects: state.objects || {}
      };
  }
};

export default ContentReducer;
