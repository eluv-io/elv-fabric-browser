import React from "react";
import { SafeTraverse } from "../../utils/Helpers";
import PropTypes from "prop-types";
import { BallPulse } from "../components/AnimatedIcons";

// A component wrapper that monitors requests to determine loading
class RequestButton extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      requestId: this.props.requestId,
      requestCompleted: false
    };
  }

  RequestInProgress() {
    return !(
      this.props.requestId === undefined ||
      SafeTraverse(this.props, "requests", this.props.requestId, "completed") ||
      SafeTraverse(this.props, "requests", this.props.requestId, "error")
    );
  }

  RequestCompleted() {
    return (
      this.props.requestId !== undefined &&
      SafeTraverse(this.props, "requests", this.props.requestId, "completed")
    );
  }

  OnRequestComplete() {
    if(this.props.OnRequestComplete) {
      this.props.OnRequestComplete();
    }

    this.setState({
      requestCompleted: true
    });
  }

  componentDidUpdate() {
    // If requestId updated, clear requestCompleted flag
    if(this.props.requestId !== this.state.requestId) {
      this.setState({
        requestId: this.props.requestId,
        requestCompleted: false
      });
    } else if(!this.state.requestCompleted) {
      if(this.RequestCompleted()) {
        this.setState({
          requestCompleted: true
        });

        if(this.OnRequestComplete) {
          this.OnRequestComplete();
        }
      }
    }
  }

  render() {
    if(!this.state.requestId || !this.RequestInProgress()) {
      return <button onClick={this.props.onClick} className={this.props.className}>{this.props.text}</button>;
    } else {
      return (
        <div className="actions-container loading">
          <div className="action-loading">
            <BallPulse />
          </div>
        </div>
      );
    }
  }
}

RequestButton.propTypes = {
  requests: PropTypes.object.isRequired,
  requestId: PropTypes.number,
  OnRequestComplete: PropTypes.func,
  className: PropTypes.string,
  onClick: PropTypes.func,
  text: PropTypes.string
};

export default RequestButton;
