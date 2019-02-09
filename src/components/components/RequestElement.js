import React from "react";
import {BallClipRotate, BallPulse} from "./AnimatedIcons";
import PropTypes from "prop-types";

class RequestElement extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    const request = this.props.requests[this.props.requestId];
    if((request && request.loading) || (this.props.render && !request)) {
      if(this.props.noIndicator) { return null; }

      const loadingIcon = this.props.loadingIcon === "rotate" ? <BallClipRotate/> : <BallPulse/>;

      return (
        <div className={`request-element ${this.props.loadingClassname || ""}`}>
          { loadingIcon }
        </div>
      );
    } else {
      if(this.props.render) {
        return this.props.render();
      } else {
        return this.props.children;
      }
    }
  }
}

RequestElement.propTypes = {
  requests: PropTypes.object.isRequired,
  render: PropTypes.func,
  children: PropTypes.element,
  noIndicator: PropTypes.bool,
  loadingClassname: PropTypes.string,
  loadingIcon: PropTypes.string
};

export default RequestElement;
