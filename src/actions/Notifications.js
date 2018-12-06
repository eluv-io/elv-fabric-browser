import ActionTypes from "./ActionTypes";

export const SetErrorMessage = ({message, redirect=false}) => {
  return ({
    type: ActionTypes.notifications.error.set,
    message: message.toString(),
    redirect: redirect
  });
};

export const SetNotificationMessage = ({message, redirect=false}) => {
  return ({
    type: ActionTypes.notifications.notification.set,
    message: message.toString(),
    redirect: redirect
  });
};

export const ClearNotifications = () => {
  return ({
    type: ActionTypes.notifications.clear
  });
};
