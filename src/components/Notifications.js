import React from "react";
import {IconButton} from "elv-components-js";
import CloseIcon from "../static/icons/close.svg";

class Notifications extends React.Component {
  render() {
    if(this.props.notifications.errorMessage !== "") {
      return (
        <div className="notification-container">
          <div className="notification-message-container error-message-container">
            { this.props.notifications.errorMessage }
            <IconButton icon={CloseIcon} label="close" onClick={this.props.ClearNotifications} className="clear-notification" />
          </div>
        </div>
      );
    } else if(this.props.notifications.notificationMessage !== "") {
      return (
        <div className="notification-container">
          <div className="notification-message-container">
            { this.props.notifications.notificationMessage }
            <IconButton icon={CloseIcon} label="close" onClick={this.props.ClearNotifications} className="clear-notification" />
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
