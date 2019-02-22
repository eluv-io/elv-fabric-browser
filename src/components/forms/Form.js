import React from "react";
import Redirect from "react-router-dom/es/Redirect";
import PropTypes from "prop-types";
import Action from "../components/Action";
import RequestElement from "../components/RequestElement";

class Form extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      complete: false,
      cancel: false
    };

    this.HandleSubmit = this.HandleSubmit.bind(this);
    this.HandleCancel = this.HandleCancel.bind(this);
  }

  async HandleSubmit(event) {
    event.preventDefault();
    if(!this.props.status.loading) {
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
        cancel: true
      });
    }
  }

  ErrorMessage() {
    if(!this.props.status.error) { return null; }

    return (
      <div className="form-error">
        <span>{this.props.status.errorMessage}</span>
      </div>
    );
  }

  Actions() {
    let cancelButton;
    if(this.props.OnCancel || this.props.cancelPath) {
      cancelButton = (
        <Action className="secondary" type="button" onClick={this.HandleCancel}>
          {this.props.cancelText || "Cancel"}
        </Action>
      );
    }

    return (
      <RequestElement loading={this.props.status.loading}>
        <div className="actions-container">
          { cancelButton }
          <Action type="submit">{this.props.submitText || "Submit"}</Action>
        </div>
      </RequestElement>
    );
  }

  render() {
    if(!this.props.noRedirect && this.state.complete && this.props.redirectPath) {
      return (
        <Redirect push to={ this.props.redirectPath } />
      );
    } else if(this.state.cancel) {
      return (
        <Redirect push to={ this.props.cancelPath } />
      );
    }

    return (
      <div className="form-container">
        <form onSubmit={this.HandleSubmit}>
          <fieldset>
            <legend>{this.props.legend}</legend>
            { this.ErrorMessage() }
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
  status: PropTypes.object.isRequired,
  redirectPath: PropTypes.string,
  cancelPath: PropTypes.string,
  noRedirect: PropTypes.bool,
  submitText: PropTypes.string,
  cancelText: PropTypes.string,
  OnSubmit: PropTypes.func.isRequired,
  OnCancel: PropTypes.func,
  OnComplete: PropTypes.func,
  OnError: PropTypes.func
};

export default Form;
