import React from "react";
import RequestForm from "../../forms/RequestForm";

class AccountForm extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      password: ""
    };

    this.FormContent = this.FormContent.bind(this);
    this.HandleInputChange = this.HandleInputChange.bind(this);
    this.HandleSubmit = this.HandleSubmit.bind(this);
  }

  HandleInputChange(event) {
    this.setState({
      [event.target.name]: event.target.value
    });
  }

  HandleSubmit() {
    let requestId = this.props.CreateAccount({
      password: this.state.password
    });

    this.setState({ requestId: requestId });
  }

  FormContent() {
    return (
      <div className="form-content">
        <div className="labelled-input">
          <label htmlFor="password">Password</label>
          <input type="password" name="password" value={this.state.password} onChange={this.HandleInputChange} />
        </div>
      </div>
    );
  }

  render() {
    return (
      <RequestForm
        requests={this.props.requests}
        requestId={this.state.requestId}
        legend="Create a new account"
        formContent={this.FormContent()}
        redirect={this.state.finished}
        redirectPath={"/accounts"}
        cancelPath={"/accounts"}
        OnSubmit={this.HandleSubmit}
      />
    );
  }
}

export default AccountForm;
