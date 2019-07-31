import Fabric from "../clients/Fabric";
import ActionTypes from "../actions/ActionTypes";

const FrameRoutingReducer = (state = {}, action) => {
  const newState = {...state};

  switch(action.type) {
    case ActionTypes.routes.path:
      newState.path = decodeURI(action.path).split("?")[0];
      break;

    // Do not start synchronize routes until original route has loaded and app
    // has redirected, if necessary
    case ActionTypes.routes.synchronize:
      newState.synchronizeRoutes = true;
      break;

    // Any time the route changes, make the core-js container update the app path
    case "@@router/LOCATION_CHANGE":
      if(state.synchronizeRoutes) {
        Fabric.SetFramePath({path: action.payload.location.pathname});
      }

      break;
  }

  return newState;
};

export default FrameRoutingReducer;
