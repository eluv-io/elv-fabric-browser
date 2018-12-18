import ActionTypes from "./ActionTypes";

export const StartRouteSynchronization = () => {
  return (dispatch) => {
    dispatch({type: ActionTypes.routes.synchronize});
  };
};
