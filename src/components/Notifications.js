import React from "react";
import {IconButton} from "elv-components-js";
import CloseIcon from "../static/icons/close.svg";
import {inject, observer} from "mobx-react";

@inject("notificationStore")
@observer
class Notifications extends React.Component {
  render() {
    if(this.props.notificationStore.error) {
      return (
        <div className="notification-container">
          <div className="notification-message-container error-message-container">
            <span>{ this.props.notificationStore.error }</span>
            <IconButton icon={CloseIcon} label="close" onClick={this.props.notificationStore.ClearMessage} className="clear-notification" />
          </div>
        </div>
      );
    } else if(this.props.notificationStore.notification) {
      return (
        <div className="notification-container">
          <div className="notification-message-container">
            <span>{ this.props.notificationStore.notification }</span>
            <IconButton icon={CloseIcon} label="close" onClick={this.props.notificationStore.ClearMessage} className="clear-notification" />
          </div>
        </div>
      );
    } else {
      return (
        <div className="notification-container" />
      );
    }
  }
}

export default Notifications;
