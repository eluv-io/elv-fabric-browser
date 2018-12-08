import ActionTypes from "../actions/ActionTypes";

const RequestsReducer = (state = {}, action) => {
  switch (action.type) {
    case ActionTypes.requests.status.submitted:
      return {
        ...state,
        [action.requestId]: {
          updatedAt: Date.now(),
          loading: true,
          completed: false,
          error: false
        }
      };

    case ActionTypes.requests.status.completed:
      return {
        ...state,
        [action.requestId]: {
          updatedAt: Date.now(),
          loading: false,
          completed: true,
          error: false,
        }
      };

    case ActionTypes.requests.status.error:
      return {
        ...state,
        [action.requestId]: {
          updatedAt: Date.now(),
          loading: false,
          completed: false,
          error: true,
          error_message: action.error_message
        }
      };

    default:
      return {
        ...state,
      };
  }
};

export default RequestsReducer;
