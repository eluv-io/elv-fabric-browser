import React from "react";
import { SafeTraverse } from "../../utils/Helpers";
import PropTypes from "prop-types";
import { BallPulse } from "../components/AnimatedIcons";

// A component wrapper that monitors requests to determine loading
class RequestPage extends React.Component {
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
    this.setState({
      requestCompleted: true
    }, () => {
      if(this.props.OnRequestComplete) {
        this.props.OnRequestComplete();
      }
    });
  }

  componentDidUpdate() {
    // If requestId updated, clear requestCompleted flag
    if(this.props.requestId !== this.state.requestId) {
      this.setState({
        requestId: this.props.requestId,
        requestCompleted: false
      })
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
    if(this.state.requestCompleted) {
      return this.props.pageContent;
    } else if (this.RequestInProgress()) {
      return (
        <div className="page-container loading-page-container">
          <BallPulse />
        </div>
      );
    } else {
      return null;
    }
  }
}

RequestPage.propTypes = {
  requests: PropTypes.object,
  requestId: PropTypes.number,
  pageContent: PropTypes.node,
  OnRequestComplete: PropTypes.func
};

export default RequestPage;
