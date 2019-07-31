import ActionTypes from "../actions/ActionTypes";

const NotificationsReducer = (state = {}, action) => {
  const newState = {
    ...state,
    notificationMessage: state.notificationMessage || "",
    errorMessage: state.errorMessage || "",
    redirect: state.redirect || false
  };

  switch(action.type) {
    case ActionTypes.notifications.error:
      newState.errorMessage = action.message;
      newState.notificationMessage = "";
      newState.redirect = action.redirect || false;
      break;

    case ActionTypes.notifications.notification:
      newState.errorMessage = "";
      newState.notificationMessage = action.message;
      newState.redirect = action.redirect || false;
      break;

    case ActionTypes.notifications.clear:
      newState.errorMessage = "";
      newState.notificationMessage = "";
      break;

    case "@@router/LOCATION_CHANGE":
      // Automatically clear notifications when changing pages
      // Notifications survive one redirect if specified
      if(state.redirect) {
        newState.redirect = false;
      } else {
        newState.errorMessage = "";
        newState.notificationMessage = "";
      }

      break;
  }

  return newState;
};

export default NotificationsReducer;
