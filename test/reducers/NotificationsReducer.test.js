import NotificationsReducer from "../../src/reducers/NotificationsReducer";
import ActionTypes from "../../src/actions/ActionTypes";

describe("Request Reducer", () => {
  let notificationMessage = "Test Notification";
  let errorMessage = "Test Error";
  let initialState = {
    notificationMessage: "",
    errorMessage: "",
    redirect: false
  };

  test("Initial state", () => {
    expect(NotificationsReducer(undefined, {type: "@@INIT"})).toEqual(initialState);
  });

  test("Notification message set", () => {
    expect(NotificationsReducer(
      initialState,
      {
        type: ActionTypes.notifications.notification.set,
        message: notificationMessage
      }
    )).toEqual({
      notificationMessage: notificationMessage,
      errorMessage: "",
      redirect: false
    });
  });

  test("Notification message cleared", () => {
    expect(NotificationsReducer(
      { ...initialState, notificationMessage},
      {
        type: ActionTypes.notifications.clear,
      }
    )).toEqual(initialState);
  });

  test("Error message set", () => {
    expect(NotificationsReducer(
      initialState,
      {
        type: ActionTypes.notifications.error.set,
        message: errorMessage
      }
    )).toEqual({
      notificationMessage: "",
      errorMessage: errorMessage,
      redirect: false
    });
  });

  test("Error message cleared", () => {
    expect(NotificationsReducer(
      { ...initialState, errorMessage },
      {
        type: ActionTypes.notifications.clear,
      }
    )).toEqual(initialState);
  });


  test("Redirect clears messages", () => {
    expect(NotificationsReducer(
      { ...initialState, notificationMessage, errorMessage },
      {
        type: "@@router/LOCATION_CHANGE",
      }
    )).toEqual(initialState);
  });

  test("Redirect does not clear message if redirect flag is set", () => {
    expect(NotificationsReducer(
      { notificationMessage, errorMessage, redirect: true },
      {
        type: "@@router/LOCATION_CHANGE"
      }
    )).toEqual({ notificationMessage, errorMessage, redirect: false });
  });
});
