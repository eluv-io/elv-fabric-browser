import ActionTypes from "./ActionTypes";
import Fabric from "../clients/Fabric";

export const GetFramePath = () => {
  return async (dispatch) => {
    dispatch({
      type: ActionTypes.routes.path,
      path: await Fabric.GetFramePath()
    });
  };
};

export const StartRouteSynchronization = () => {
  return (dispatch) => {
    dispatch({type: ActionTypes.routes.synchronize});
  };
};
