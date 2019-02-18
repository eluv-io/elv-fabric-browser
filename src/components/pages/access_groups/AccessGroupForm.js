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
      <div className="access-group-form-data">
        <div className="labelled-input">
          <label className="label" htmlFor="name">Name</label>
          <input name="name" value={this.state.name} onChange={this.HandleInputChange} />
        </div>
        <div className="labelled-input">
          <label className="label" htmlFor="description">Description</label>
          <textarea name="description" value={this.state.description} onChange={this.HandleInputChange} />
        </div>
      </div>
    );
  }

  render() {
    const contractAddress = this.props.contractAddress || this.state.contractAddress;
    const completed = this.props.methodStatus.Submit.completed && !!contractAddress;
    
    let redirectPath = Path.dirname(this.props.match.url);
    if(this.props.createForm) {
      // On creation, contract address won't exist until submission
      redirectPath = contractAddress ?
        Path.join(Path.dirname(this.props.match.url), contractAddress) : Path.dirname(this.props.match.url);
    }

    return (
      <Form
        legend={this.props.createForm ? "Create Access Group" : "Manage Access Group"}
        formContent={this.AccessGroupForm()}
        redirectPath={redirectPath}
        cancelPath={Path.dirname(this.props.match.url)}
        redirect={completed}
        OnSubmit={this.HandleSubmit}
        submitting={this.props.methodStatus.Submit.loading}
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
