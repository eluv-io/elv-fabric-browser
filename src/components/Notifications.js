import React from "react";

class Notifications extends React.Component {
  render() {
    if(this.props.notifications.errorMessage !== "") {
      return (
        <div className="notification-container">
          <div className="notification-message error-message-container">
            { this.props.notifications.errorMessage }
            <div className="clear-notification" onClick={this.props.ClearNotifications}>X</div>
          </div>
        </div>
      );
    } else if(this.props.notifications.notificationMessage !== "") {
      return (
        <div className="notification-container">
          <div className="notification-message-container">
            { this.props.notifications.notificationMessage }
            <div className="clear-notification" onClick={this.props.ClearNotifications}>X</div>
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