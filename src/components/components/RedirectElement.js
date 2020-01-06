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
    if(!this.props.to) {
      return this.props.children;
    }

    if(this.state.redirect) {
      return <Redirect push to={this.props.to} />;
    }

    // Attach onClick and tab index to cloned version of child
    const onClick = () => this.setState({redirect: true});
    return (
      React.cloneElement(
        this.props.children,
        {
          onClick,
          onMouseDown: e => {
            if(e.button !== 1) { return; }

            // Open in new tab on middle click
            e.preventDefault();
            window.open("/#/" + this.props.to);
          },
          onKeyPress: onClick,
          tabIndex: "0"
        }
      )
    );
  }
}

RedirectElement.propTypes = {
  to: PropTypes.string,
  children: PropTypes.element.isRequired
};

export default RedirectElement;
