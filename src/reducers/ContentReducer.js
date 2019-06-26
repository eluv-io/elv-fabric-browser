import ActionTypes from "../actions/ActionTypes";

const ContentReducer = (state = {}, action) => {
  switch(action.type) {
    case ActionTypes.content.libraries.list:
      return {
        ...state,
        libraries: action.libraries,
        count: {
          ...state.count,
          libraries: action.count
        }
      };

    case ActionTypes.content.libraries.get:
      return {
        ...state,
        libraries: {
          ...state.libraries,
          [action.libraryId]: action.library
        }
      };

    case ActionTypes.content.libraries.types:
      return {
        ...state,
        libraries: {
          ...state.libraries,
          [action.libraryId]: {
            ...state.libraries[action.libraryId],
            types: action.types
          }
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
          ...action.objects
        },
        count: {
          ...state.count,
          objects: {
            ...(state.count.objects || {}),
            [action.libraryId]: action.count
          }
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

    case ActionTypes.content.objects.permissions:
      return {
        ...state,
        objects: {
          ...state.objects,
          [action.objectId]: {
            ...state.objects[action.objectId],
            permissions: action.permissions
          }
        }
      };

    case ActionTypes.content.types.all:
      return {
        ...state,
        allTypes: action.types
      };
    case ActionTypes.content.types.list:
      return {
        ...state,
        types: action.types,
        count: {
          ...state.count,
          types: action.count
        }
      };
    case ActionTypes.content.types.get:
      return {
        ...state,
        types: {
          ...state.types,
          [action.contentType.hash]: action.contentType
        }
      };

    default:
      return {
        ...state,
        libraries: state.libraries || {},
        objects: state.objects || {},
        types: state.types || {},
        allTypes: state.allTypes || {},
        count: state.count || {libraries: 0, objects: {}, types: 0}
      };
  }
};

export default ContentReducer;
