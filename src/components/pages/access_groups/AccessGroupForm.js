import React from "react";
import PropTypes from "prop-types";
import Path from "path";
import Form from "../../forms/Form";

class AccessGroupForm extends React.Component {
  constructor(props) {
    super(props);

    const accessGroup = props.accessGroup || {};

    this.state = {
      name: accessGroup.name || "",
      description: accessGroup.description || "",
      members: accessGroup.members || {},
      redirectPath: Path.dirname(this.props.match.url)
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
    const contractAddress = await this.props.methods.Submit({
      address: this.props.contractAddress,
      name: this.state.name,
      description: this.state.description,
      members: this.state.members
    });

    // Ensure redirect path is updated before completion
    await new Promise(resolve =>
      this.setState({
        redirectPath: Path.join(Path.dirname(this.props.match.url), contractAddress)
      }, resolve)
    );
  }

  AccessGroupForm() {
    return (
      <div className="form-content">
        <label htmlFor="name">Name</label>
        <input name="name" value={this.state.name} onChange={this.HandleInputChange} />

        <label htmlFor="description">Description</label>
        <textarea name="description" value={this.state.description} onChange={this.HandleInputChange} />
      </div>
    );
  }

  render() {
    return (
      <Form
        legend={this.props.createForm ? "Create Access Group" : "Manage Access Group"}
        formContent={this.AccessGroupForm()}
        redirectPath={this.state.redirectPath}
        cancelPath={Path.dirname(this.props.match.url)}
        status={this.props.methodStatus.Submit}
        OnSubmit={this.HandleSubmit}
      />
    );
  }
}

AccessGroupForm.propTypes = {
  accessGroup: PropTypes.object,
  contractAddress: PropTypes.string,
  createForm: PropTypes.bool.isRequired,
  methods: PropTypes.shape({
    Submit: PropTypes.func.isRequired
  })
};

export default AccessGroupForm;
