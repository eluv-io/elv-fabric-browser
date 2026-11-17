import {makeAutoObservable} from "mobx";

class NotificationStore {
  notification;
  error;
  redirect = false;

  constructor(rootStore) {
    makeAutoObservable(this);

    this.rootStore = rootStore;
  }

  SetNotificationMessage({message, redirect=false}) {
    this.notification = message;
    this.error = "";
    this.redirect = redirect;
  }


  SetErrorMessage({message, redirect=false}) {
    this.notification = "";
    this.error = message;
    this.redirect = redirect;
  }


  ClearMessage() {
    this.notification = "";
    this.error = "";
    this.redirect = false;
  }


  ChangeRoute() {
    if(this.redirect) {
      this.redirect = false;
    } else {
      this.ClearMessage();
    }
  }
}

export default NotificationStore;
