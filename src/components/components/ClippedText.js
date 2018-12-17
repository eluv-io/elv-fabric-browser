import React from "react";
import PropTypes from "prop-types";

// A block of text whose overflow is hidden by default
// Clicking on the block will toggle showing the full text
class ClippedText extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      showMore: false
    };

    this.ToggleVisibility = this.ToggleVisibility.bind(this);
  }

  ToggleVisibility() {
    this.setState({
      showMore: !this.state.showMore
    });
  }

  render() {
    const displayClass = this.state.showMore ? "clipped-text show " : "clipped-text hide ";
    const coverClass = this.state.showMore ? "cover show-less" : "cover show-more";
    const showText = this.state.showMore ? "Show less" : "Show more";

    return (
      <div className={displayClass + this.props.className} title={showText}>
        <pre className="text">
          {this.props.text}
        </pre>
        <div className={coverClass} onClick={this.ToggleVisibility}></div>
      </div>
    );
  }
}

ClippedText.propTypes = {
  text: PropTypes.string
};

export default ClippedText;
