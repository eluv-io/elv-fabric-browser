import ActionTypes from "../actions/ActionTypes";

const ContentReducer = (state = {}, action) => {
  const newState = {
    ...state,
    libraries: state.libraries || {},
    objects: state.objects || {},
    types: state.types || {},
    availableTypes: state.availableTypes || {},
    count: state.count || {libraries: 0, objects: {}, types: 0, libraryGroups: {}}
  };

  switch(action.type) {
    case ActionTypes.content.libraries.list:
      newState.libraries = action.libraries;
      newState.count.libraries = action.count;
      break;

    case ActionTypes.content.libraries.get:
      newState.libraries[action.libraryId] = action.library;
      break;

    case ActionTypes.content.libraries.types:
      newState.libraries[action.libraryId].types = action.types;
      break;

    case ActionTypes.content.libraries.groups:
      newState.libraries[action.libraryId].groups = action.groups;
      newState.count.libraryGroups[action.libraryId] = action.count;
      break;

    case ActionTypes.content.libraries.groupPermissions:
      newState.libraries[action.libraryId].groupPermissions = action.permissions;
      break;

    case ActionTypes.content.objects.list:
      newState.objects = action.objects;
      newState.count.objects[action.libraryId] = action.count;
      newState.cacheId = action.cacheId;
      break;

    case ActionTypes.content.objects.get:
      newState.objects[action.objectId] = action.object;
      break;

    case ActionTypes.content.objects.versions:
      newState.objects[action.objectId].versions = action.versions;
      break;

    case ActionTypes.content.objects.permissions:
      newState.objects[action.objectId].permissions = action.permissions;
      break;

    case ActionTypes.content.types.all:
      newState.availableTypes = action.types;
      break;

    case ActionTypes.content.types.list:
      newState.types = action.types;
      newState.count.types = action.count;
      break;

    case ActionTypes.content.types.get:
      newState.types[action.contentType.hash] = action.contentType;
      break;
  }

  return newState;
};

export default ContentReducer;
