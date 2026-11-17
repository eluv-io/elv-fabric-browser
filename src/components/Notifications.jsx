import React from "react";
import CloseIcon from "@/assets/icons/close.svg";
import {observer} from "mobx-react";
import {reaction} from "mobx";

import {notificationStore} from "@/stores/index";
import ImageIcon from "@/components/components/ImageIcon";

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
          notification: notificationStore.notification,
          error: notificationStore.error
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

    if(notificationStore.error) {
      return (
        <div className="notification-container" key={key}>
          <div className="notification-message-container error-message-container">
            <span>{ notificationStore.error }</span>
            <button title="clear-notification" onClick={notificationStore.ClearMessage} className="clear-notification">
              <ImageIcon icon={CloseIcon} />
            </button>
          </div>
        </div>
      );
    } else if(notificationStore.notification) {
      return (
        <div className="notification-container" key={key}>
          <div className="notification-message-container">
            <span>{ notificationStore.notification }</span>
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

export default observer(Notifications);
