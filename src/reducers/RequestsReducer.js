import ActionTypes from "../actions/ActionTypes";

const RequestsReducer = (state = {}, action) => {
  switch (action.type) {
    case ActionTypes.request.request.status.submitted:
      return {
        ...state,
        [action.domain]: {
          ...state[action.domain],
          [action.requestId]: {
            action: action.action,
            updatedAt: Date.now(),
            loading: true,
            completed: false,
            error: false
          }
        }
      };

    case ActionTypes.request.request.status.completed:
      return {
        ...state,
        [action.domain]: {
          ...state[action.domain],
          [action.requestId]: {
            action: action.action,
            updatedAt: Date.now(),
            loading: false,
            completed: true,
            error: false,
          }
        }
      };

    case ActionTypes.request.request.status.error:
      return {
        ...state,
        [action.domain]: {
          ...state[action.domain],
          [action.requestId]: {
            action: action.action,
            updatedAt: Date.now(),
            loading: false,
            completed: false,
            error: true,
            error_message: action.error_message
          }
        }
      };

    default:
      return {
        ...state,
      };
  }
};

export default RequestsReducer;
