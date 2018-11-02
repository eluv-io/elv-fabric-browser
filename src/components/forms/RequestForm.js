import React from "react";
import { SafeTraverse } from "../../utils/Helpers";
import Form from "../forms/Form";
import PropTypes from "prop-types";

// A form that monitors requests to determine submit status
class RequestForm extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      completed: {}
    };

    this.RequestInProgress = this.RequestInProgress.bind(this);
    this.RequestCompleted = this.RequestCompleted.bind(this);
  }

  RequestInProgress() {
    return !(
      this.props.requestId === undefined ||
      SafeTraverse(this.props, "requests", this.props.requestId, "completed") ||
      SafeTraverse(this.props, "requests", this.props.requestId, "error")
    );
  }

  RequestCompleted() {
    return (
      this.props.requestId !== undefined &&
      SafeTraverse(this.props, "requests", this.props.requestId, "completed")
    );
  }

  RequestError() {
    if ( this.props.requestId !== undefined &&
      SafeTraverse(this.props, "requests", this.props.requestId, "error") ) {
      return this.props.requests[this.props.requestId].error_message;
    }
  }

  componentDidUpdate() {
    const completed = this.RequestCompleted();
    const errorMessage = this.RequestError();

    if(completed || errorMessage && !this.state.completed[this.props.requestId]) {
      this.setState({
        completed: {
          ...this.state.completed,
          [this.props.requestId]: true
        }
      });
      if (completed && this.props.OnComplete) {
        this.props.OnComplete();
      } else if (errorMessage && this.props.OnError) {
        this.props.OnError(errorMessage);
      }
    }
  }

  render() {
    return (
      <Form
        legend={this.props.legend}
        submitText={this.props.submitText}
        cancelText={this.props.cancelText}
        formContent={this.props.formContent}
        submitting={this.RequestInProgress()}
        redirect={this.RequestCompleted()}
        redirectPath={this.props.redirectPath}
        cancelPath={this.props.cancelPath}
        OnSubmit={this.props.OnSubmit}
        OnCancel={this.props.OnCancel}
      />
    );
  }
}

RequestForm.propTypes = {
  ...Form.propTypes,
  requests: PropTypes.object,
  requestId: PropTypes.number,
  OnComplete: PropTypes.func,
  OnError: PropTypes.func
};

export default RequestForm;
