import ActionTypes from "./ActionTypes";
import { SetErrorMessage } from "./Notifications";
import Id from "../utils/Id";

// Wrap actions with requests to keep request state updated automatically
// Returns a unique ID corresponding to the request state
export const WrapRequest = ({todo, modal=false}) => {
  return (dispatch) => {
    let requestId = Id.next();

    Request({
      requestId,
      dispatch,
      modal,
      todo
    });

    return requestId;
  };
};

const Request = async ({
  requestId,
  dispatch,
  modal,
  todo
}) => {
  dispatch(RequestSubmitted(requestId));

  try {
    await todo();

    dispatch(RequestCompleted(requestId));
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

    dispatch(RequestError(requestId, errorMessage));

    // Modals will handle their own errors
    if(!modal) {
      dispatch(SetErrorMessage({message: errorMessage}));
    }
  }
};

const RequestSubmitted = (requestId) => {
  return {
    type: ActionTypes.requests.status.submitted,
    requestId
  };
};

const RequestCompleted = (requestId) => {
  return {
    type: ActionTypes.requests.status.completed,
    requestId
  };
};

const RequestError = (requestId, error_message) => {
  return {
    type: ActionTypes.requests.status.error,
    requestId,
    error_message
  };
};
