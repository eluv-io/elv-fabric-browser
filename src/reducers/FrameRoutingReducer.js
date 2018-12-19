import Fabric from "../clients/Fabric";
import ActionTypes from "../actions/ActionTypes";

const FrameRoutingReducer = (state = {}, action) => {
  switch (action.type) {
    // Do not start synchronize routes until original route has loaded and app
    // has redirected, if necessary
    case ActionTypes.routes.synchronize:
      return {
        ...state,
        synchronizeRoutes: true,
      };
    // Any time the route changes, make the core-js container update the app path
    case "@@router/LOCATION_CHANGE":
      if(state.synchronizeRoutes) {
        Fabric.SetFramePath({path: action.payload.location.pathname});
      }
  }

  return state;
};

export default FrameRoutingReducer;
