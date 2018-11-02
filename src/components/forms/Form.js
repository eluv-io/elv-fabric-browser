import React from "react";
import Redirect from "react-router-dom/es/Redirect";
import PropTypes from "prop-types";
import { BallPulse } from "../components/AnimatedIcons";

class Form extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      redirect: false,
      cancelRedirect: false
    };

    this.HandleSubmit = this.HandleSubmit.bind(this);
    this.HandleCancel = this.HandleCancel.bind(this);
  }

  HandleSubmit(event) {
    event.preventDefault();
    if(!this.props.submitting) {
      this.props.OnSubmit(event);
    }
  }

  HandleCancel() {
    if(this.props.OnCancel) {
      this.props.OnCancel();
    }

    if(this.props.cancelPath) {
      this.setState({
        cancelRedirect: true
      });
    }
  }

  Actions() {
    if(this.props.submitting) {
      return (
        <div className="actions-container loading">
          <div className="action-loading">
            <BallPulse />
          </div>
        </div>
      );
    }

    return (
      <div className="actions-container">
        <a className="action secondary" onClick={this.HandleCancel}>{this.props.cancelText || "Cancel"}</a>
        <input className="action" type="submit" value={this.props.submitText || "Submit"} />
      </div>
    );
  }

  render() {
    if((this.props.redirect || this.state.redirect) && this.props.redirectPath) {
      return (
        <Redirect push to={ this.props.redirectPath } />
      );
    } else if(this.state.cancelRedirect) {
      return (
        <Redirect push to={ this.props.cancelPath } />
      );
    }

    return (
      <div className="page-container">
        <form onSubmit={this.HandleSubmit}>
          <fieldset>
            <legend>{this.props.legend}</legend>
            { this.props.formContent }
            { this.Actions() }
          </fieldset>
        </form>
      </div>
    );
  }
}

Form.propTypes = {
  formContent: PropTypes.node.isRequired,
  OnSubmit: PropTypes.func.isRequired,
  OnCancel: PropTypes.func,
  legend: PropTypes.string,
  submitText: PropTypes.string,
  cancelText: PropTypes.string,
  redirect: PropTypes.bool,
  redirectPath: PropTypes.string,
  cancelPath: PropTypes.string,
  submitting: PropTypes.bool
};

export default Form;
