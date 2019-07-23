import React from "react";
import PropTypes from "prop-types";
import Path from "path";
import {Action, Form} from "elv-components-js";

class AccessGroupMemberForm extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      memberAddress: "",
      manager: false
    };

    this.HandleInputChange = this.HandleInputChange.bind(this);
    this.HandleSubmit = this.HandleSubmit.bind(this);
  }

  HandleInputChange(event) {
    this.setState({
      [event.target.name]: event.target.value
    });
  }

  async HandleSubmit() {
    await this.props.methods.Submit({
      contractAddress: this.props.contractAddress,
      memberAddress: this.state.memberAddress,
      manager: this.state.manager
    });
  }

  render() {
    let status = {...this.props.methodStatus.Submit};

    const backPath = Path.dirname(this.props.match.url);

    return (
      <div>
        <div className="actions-container manage-actions">
          <Action type="link" to={Path.dirname(this.props.match.url)} className="secondary">Back</Action>
        </div>
        <Form
          legend={`Add member to '${this.props.accessGroup.name}'`}
          redirectPath={backPath}
          cancelPath={backPath}
          status={status}
          OnSubmit={this.HandleSubmit}
        >
          <div className="form-content">
            <label htmlFor="memberAddress">Address</label>
            <input name="memberAddress" value={this.state.memberAddress} onChange={this.HandleInputChange} />

            <label htmlFor="manager">Manager</label>
            <input type="checkbox" name="manager" value={this.state.manager} onChange={() => this.setState({manager: !this.state.manager})} />
          </div>
        </Form>
      </div>
    );
  }
}

AccessGroupMemberForm.propTypes = {
  accessGroup: PropTypes.object,
  contractAddress: PropTypes.string,
  methods: PropTypes.shape({
    Submit: PropTypes.func.isRequired
  })
};

export default AccessGroupMemberForm;
