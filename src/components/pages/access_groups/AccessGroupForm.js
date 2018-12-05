import React from "react";
import RequestForm from "../../forms/RequestForm";
import RequestPage from "../RequestPage";
import Path from "path";

class AccessGroupForm extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      name: "",
      description: "",
      members: {},
      submitRequestId: undefined,
      loadRequestId: undefined,
      createForm: this.props.location.pathname.endsWith("create"),
      accessGroupName: this.props.match.params.accessGroupName
    };

    this.RequestComplete = this.RequestComplete.bind(this);
    this.HandleInputChange = this.HandleInputChange.bind(this);
    this.HandleSubmit = this.HandleSubmit.bind(this);
  }

  componentDidMount() {
    if(!this.state.createForm) {
      this.setState({
        loadRequestId: this.props.ListAccessGroups()
      })
    }
  }

  RequestComplete() {
    const accessGroup = this.props.accessGroups[this.state.accessGroupName];
    this.setState({
      accessGroup,
      name: accessGroup.name,
      description: accessGroup.description,
      address: accessGroup.address,
      members: accessGroup.members
    });
  }

  HandleInputChange(event) {
    this.setState({
      [event.target.name]: event.target.value
    });
  }

  HandleSubmit() {
    this.setState({
      submitRequestId: this.props.SaveAccessGroup({
        name: this.state.name,
        description: this.state.description,
        address: this.state.address,
        members: this.state.members,
        originalName: this.state.accessGroupName
      })
    });
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

  PageContent() {
    if(!this.state.createForm && !this.state.accessGroup) { return null; }

    // If name changes, make sure to update redirect path to new name
    const redirectPath = this.state.createForm ?
      this.props.match.url :
      this.props.match.url.replace(this.state.accessGroup.name, this.state.name);

    return (
      <RequestForm
        requests={this.props.requests}
        requestId={this.state.submitRequestId}
        legend={this.state.createForm ? "Create Access Group" : "Edit Access Group"}
        formContent={this.AccessGroupForm()}
        redirectPath={Path.dirname(redirectPath)}
        cancelPath={Path.dirname(this.props.match.url)}
        OnSubmit={this.HandleSubmit}
      />
    );
  }

  render() {
    if (this.state.createForm) {
      return this.PageContent();
    } else {
      return (
        <RequestPage
          requests={this.props.requests}
          requestId={this.state.loadRequestId}
          pageContent={this.PageContent()}
          OnRequestComplete={this.RequestComplete}
        />
      )
    }
  }
}

export default AccessGroupForm;
