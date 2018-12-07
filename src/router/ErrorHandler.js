import * as React from "react";
import PropTypes from "prop-types";
import connect from "react-redux/es/connect/connect";
import Thunk from "../utils/Thunk";

import {SetErrorMessage} from "../actions/Notifications";

// Wrap a component and catch any errors it throws
// When an error is thrown, display the error in a notification
// Clear the error when the route changes
class ErrorHandler extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      errorCaught: false
    };
  }

  componentDidCatch(error) {
    this.props.SetErrorMessage({
      message: error.toString()
    });

    this.setState({
      errorCaught: true,
      errorRoute: this.props.router.location.pathname
    });
  }

  componentDidUpdate() {
    if(this.state.errorCaught) {
      if(this.props.router.location.pathname !== this.state.errorRoute) {
        this.setState({
          errorCaught: false,
          errorRoute: undefined
        });
      }
    }
  }

  render() {
    if(this.state.errorCaught) { return null; }

    return this.props.component(this.props);
  }
}

ErrorHandler.propTypes = {
  component: PropTypes.func.isRequired
};

export default connect(
  (state) => { return {router: state.router}; },
  (dispatch) => Thunk(dispatch, [ SetErrorMessage ])
)(ErrorHandler);
