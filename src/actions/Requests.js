import ActionTypes from "./ActionTypes";
import { SetErrorMessage } from "./Notifications";
import Id from "../utils/Id";
import { Wait } from "../utils/Helpers";

// Wrap actions with requests to keep request state updated automatically
// Returns a unique ID corresponding to the request state
export const WrapRequest = (
  {
    dispatch,
    domain,
    action,
    modal=false,
    todo
  }
) => {
  let requestId = Id.next();

  Request({
    requestId,
    dispatch,
    domain,
    action,
    modal,
    todo
  });

  return requestId;
};

const Request = async (
  {
    requestId,
    dispatch,
    domain,
    action,
    modal,
    todo
  }
) => {
  dispatch(RequestSubmitted(requestId, domain, action));

  try {
    // Simulate loading time
    //await Wait(500);

    await todo();

    dispatch(RequestCompleted(requestId, domain, action));
  } catch(error) {
    let errorMessage = error;
    if(typeof error !== "string") {
      // Error object -- actual message may be present in one of several different keys
      errorMessage = error.message ||
        error.statusText ||
        (error.responseText && JSON.parse(error.responseText).error.message) ||
        error;
    }

    dispatch(RequestError(requestId, domain, action, errorMessage));

    // Modals will handle their own errors
    if(!modal) {
      dispatch(SetErrorMessage({message: errorMessage}));
    }
  }
};

const RequestSubmitted = (requestId, domain, action) => {
  return {
    type: ActionTypes.request.request.status.submitted,
    requestId: requestId,
    domain: domain,
    action: action
  };
};

const RequestCompleted = (requestId, domain, action) => {
  return {
    type: ActionTypes.request.request.status.completed,
    requestId: requestId,
    domain: domain,
    action: action
  };
};

const RequestError = (requestId, domain, action, error_message) => {
  return {
    type: ActionTypes.request.request.status.error,
    requestId: requestId,
    domain: domain,
    action: action,
    error_message: error_message
  };
};
