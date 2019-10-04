import {action, observable} from "mobx";

class NotificationStore {
  @observable notification;
  @observable error;
  @observable redirect = false;

  constructor(rootStore) {
    this.rootStore = rootStore;
  }

  @action.bound
  SetNotificationMessage({message, redirect=false}) {
    this.notification = message;
    this.error = "";
    this.redirect = redirect;
  }

  @action.bound
  SetErrorMessage({message, redirect=false}) {
    this.notification = "";
    this.error = message;
    this.redirect = redirect;
  }

  @action.bound
  ClearMessage() {
    this.notification = "";
    this.error = "";
    this.redirect = false;
  }

  @action.bound
  ChangeRoute() {
    if(this.redirect) {
      this.redirect = false;
    } else {
      this.ClearMessage();
    }
  }
}

export default NotificationStore;
