import React from "react";
import Redirect from "react-router-dom/es/Redirect";
import PropTypes from "prop-types";
import { BallPulse } from "../components/AnimatedIcons";
import Action from "../components/Action";

class Form extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      complete: false,
      redirect: false,
      cancelRedirect: false
    };

    this.HandleSubmit = this.HandleSubmit.bind(this);
    this.HandleCancel = this.HandleCancel.bind(this);
  }

  async HandleSubmit(event) {
    event.preventDefault();
    if(!this.props.submitting) {
      try {
        await this.props.OnSubmit(event);

        if(this.props.OnComplete) {
          await this.props.OnComplete();
        }

        this.setState({
          complete: true
        });
      } catch(error) {
        if(this.props.OnError) {
          await this.props.OnError(error);
        }
      }
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

    let cancelButton;
    if(this.props.OnCancel || this.props.cancelPath) {
      cancelButton = (
        <Action className="secondary" type="button" onClick={this.HandleCancel}>
          {this.props.cancelText || "Cancel"}
        </Action>
      );
    }

    return (
      <div className="actions-container">
        { cancelButton }
        <Action type="submit">{this.props.submitText || "Submit"}</Action>
      </div>
    );
  }

  render() {
    if(this.state.complete && (this.props.redirect || this.state.redirect) && this.props.redirectPath) {
      return (
        <Redirect push to={ this.props.redirectPath } />
      );
    } else if(this.state.cancelRedirect) {
      return (
        <Redirect push to={ this.props.cancelPath } />
      );
    }

    return (
      <div className="form-container">
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
  legend: PropTypes.string,
  submitText: PropTypes.string,
  cancelText: PropTypes.string,
  redirect: PropTypes.bool,
  redirectPath: PropTypes.string,
  cancelPath: PropTypes.string,
  submitting: PropTypes.bool,
  OnSubmit: PropTypes.func.isRequired,
  OnCancel: PropTypes.func,
  OnComplete: PropTypes.func,
  OnError: PropTypes.func
};

export default Form;
