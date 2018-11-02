import ActionTypes from "../actions/ActionTypes";

const NotificationsReducer = (state = {}, action) => {
  switch (action.type) {
    case ActionTypes.notifications.error.set:
      return {
        ...state,
        errorMessage: action.message,
        notificationMessage: "",
        redirect: action.redirect || false
      };
    case ActionTypes.notifications.notification.set:
      return {
        ...state,
        errorMessage: "",
        notificationMessage: action.message,
        redirect: action.redirect || false
      };
    case "@@router/LOCATION_CHANGE":
      // Automatically clear notifications when changing pages

      // Notifications survive one redirect if specified
      if(state.redirect) {
        return {
          ...state,
          redirect: false
        };
      }

      // Fallthrough
    case ActionTypes.notifications.clear:
      return {
        ...state,
        errorMessage: "",
        notificationMessage: ""
      };
    default:
      return {
        ...state,
        notificationMessage: state.notificationMessage || "",
        errorMessage: state.errorMessage || "",
        redirect: state.redirect || false
      };
  }
};

export default NotificationsReducer;
