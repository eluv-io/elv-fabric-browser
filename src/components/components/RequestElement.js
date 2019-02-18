import React from "react";
import {BallClipRotate, BallPulse} from "./AnimatedIcons";
import PropTypes from "prop-types";

class RequestElement extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    // Loading state can either be indicated by "loading" boolean or by observing a request
    let loading = this.props.loading;
    if(this.props.requests) {
      const request = this.props.requests[this.props.requestId];
      loading = (request && request.loading) || (this.props.render && !request);
    }

    if(loading) {
      if(this.props.noIndicator) { return null; }

      const loadingIcon = this.props.loadingIcon === "rotate" ? <BallClipRotate/> : <BallPulse/>;
      let className = "request-element "  + (this.props.loadingClassname || "");
      if(this.props.fullPage) { className += "loading-page-container"; }

      return (
        <div className={className}>
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
  fullPage: PropTypes.bool,
  loading: PropTypes.bool,
  requestId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  requests: PropTypes.object,
  render: PropTypes.func,
  children: PropTypes.element,
  noIndicator: PropTypes.bool,
  loadingClassname: PropTypes.string,
  loadingIcon: PropTypes.string
};

export default RequestElement;
