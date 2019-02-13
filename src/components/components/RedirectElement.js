import React from "react";
import Redirect from "react-router/es/Redirect";
import PropTypes from "prop-types";

class RedirectElement extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      redirect: false
    };
  }

  render() {
    if(this.state.redirect) {
      return <Redirect to={this.props.to} />;
    }

    // Attach onClick and tab index to cloned version of child
    const onClick = () => this.setState({redirect: true});
    return (
      React.cloneElement(
        this.props.children,
        {
          onClick,
          onKeyPress: onClick,
          tabIndex: "0"
        }
      )
    );
  }
}

RedirectElement.propTypes = {
  to: PropTypes.string.isRequired,
  children: PropTypes.element.isRequired
};

export default RedirectElement;
