import React from "react";
import PropTypes from "prop-types";
import UrlJoin from "url-join";
import Path from "path";
import Form from "elv-components-js/src/components/Form";

class AccessGroupForm extends React.Component {
  constructor(props) {
    super(props);

    const accessGroup = props.accessGroup || {};

    this.state = {
      name: accessGroup.name || "",
      description: accessGroup.description || "",
      members: accessGroup.members || {}
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

    this.setState({contractAddress});
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
    let status = {...this.props.methodStatus.Submit};
    status.completed = status.completed && !!this.state.contractAddress;

    const backPath = Path.dirname(this.props.match.url);
    const redirectPath = this.props.createForm ? UrlJoin(backPath, this.state.contractAddress || "") : backPath;

    return (
      <Form
        legend={this.props.createForm ? "Create Access Group" : "Manage Access Group"}
        formContent={this.AccessGroupForm()}
        redirectPath={redirectPath}
        cancelPath={backPath}
        status={status}
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
