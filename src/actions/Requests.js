import ActionTypes from "./ActionTypes";
import { SetErrorMessage } from "./Notifications";
import Id from "../utils/Id";
import { Wait } from "../utils/Helpers";

// Wrap actions with requests to keep request state updated automatically
// Returns a unique ID corresponding to the request state
export const WrapRequest = ({
  dispatch,
  action,
  modal=false,
  todo
}) => {
  let requestId = Id.next();

  Request({
    requestId,
    dispatch,
    action,
    modal,
    todo
  });

  return requestId;
};

const Request = async ({
  requestId,
  dispatch,
  action,
  modal,
  todo
}) => {
  dispatch(RequestSubmitted(requestId, action));

  try {
    // Simulate loading time
    //await Wait(500);

    await todo();

    dispatch(RequestCompleted(requestId, action));
  } catch(error) {
    console.error(error);

    let errorMessage = error;
    if(typeof error !== "string") {
      // Error object -- actual message may be present in one of several different keys
      errorMessage = error.message ||
        error.statusText ||
        (error.responseText && JSON.parse(error.responseText).error.message) ||
        error;
    }

    dispatch(RequestError(requestId, action, errorMessage));

    // Modals will handle their own errors
    if(!modal) {
      dispatch(SetErrorMessage({message: errorMessage}));
    }
  }
};

const RequestSubmitted = (requestId, action) => {
  return {
    type: ActionTypes.request.request.status.submitted,
    requestId,
    action
  };
};

const RequestCompleted = (requestId, action) => {
  return {
    type: ActionTypes.request.request.status.completed,
    requestId,
    action
  };
};

const RequestError = (requestId, action, error_message) => {
  return {
    type: ActionTypes.request.request.status.error,
    requestId,
    action,
    error_message
  };
};
