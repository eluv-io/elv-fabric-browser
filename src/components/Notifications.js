import React from "react";
import {IconButton} from "elv-components-js";
import CloseIcon from "../static/icons/close.svg";
import {inject, observer} from "mobx-react";
import {reaction} from "mobx";

@inject("notificationStore")
@observer
class Notifications extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      notificationVersion: 0
    };
  }

  componentDidMount() {
    // Update key on notification update to restart fadeout animation
    this.setState({
      DisposeReaction: reaction(
        () => ({
          notification: this.props.notificationStore.notification,
          error: this.props.notificationStore.error
        }),
        () => this.setState({notificationVersion: this.state.notificationVersion + 1})
      )
    });
  }

  componentWillUnmount() {
    if(this.state.DisposeReaction) {
      this.state.DisposeReaction();
    }
  }

  render() {
    const key = `notification-${this.state.notificationVersion}`;

    if(this.props.notificationStore.error) {
      return (
        <div className="notification-container" key={key}>
          <div className="notification-message-container error-message-container">
            <span>{ this.props.notificationStore.error }</span>
            <IconButton icon={CloseIcon} label="close" onClick={this.props.notificationStore.ClearMessage} className="clear-notification" />
          </div>
        </div>
      );
    } else if(this.props.notificationStore.notification) {
      return (
        <div className="notification-container" key={key}>
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
