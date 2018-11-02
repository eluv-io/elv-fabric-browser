import React from "react";
import Dash from "dashjs";
import PropTypes from "prop-types";

class DashVideo extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      videoRef: React.createRef()
    };
  }

  componentDidMount() {
    Dash.MediaPlayer().create().initialize(
      this.state.videoRef.current, this.props.videoUrl, false
    );
  }

  render() {
    return (
      <video
        className={"dash-video " + this.props.className}
        ref={this.state.videoRef}
        controls
      />
    );
  }
}

DashVideo.propTypes = {
  videoUrl: PropTypes.string.isRequired,
  className: PropTypes.string
};

export default DashVideo;
