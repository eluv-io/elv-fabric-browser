import {connectRouter} from "connected-react-router";
import Fabric from "../clients/Fabric";
import ActionTypes from "../actions/ActionTypes";

const RoutingReducer = (state = {}, action) => {
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

// Compose custom routing reducer with connect-react-router reducer
const CreateRoutingReducer = (history) => {
  const reactRouterReducer = connectRouter(history);

  if(!Fabric.isFrameClient) {
    return reactRouterReducer;
  }

  return (state, action) => {
    return RoutingReducer(
      reactRouterReducer(state, action),
      action
    );
  };
};

export default CreateRoutingReducer;
