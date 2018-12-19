import React from "react";
import RequestForm from "../../forms/RequestForm";
import RequestPage from "../RequestPage";
import Path from "path";

class AccessGroupForm extends React.Component {
  constructor(props) {
    super(props);

    const contractAddress = this.props.match.params.contractAddress;

    this.state = {
      name: "",
      description: "",
      members: {},
      submitRequestId: undefined,
      loadRequestId: undefined,
      createForm: (!contractAddress),
      contractAddress
    };

    this.PageContent = this.PageContent.bind(this);
    this.RequestComplete = this.RequestComplete.bind(this);
    this.HandleInputChange = this.HandleInputChange.bind(this);
    this.HandleSubmit = this.HandleSubmit.bind(this);
  }

  componentDidMount() {
    if(!this.state.createForm) {
      this.setState({
        loadRequestId: this.props.WrapRequest({
          todo: async () => {
            await this.props.ListAccessGroups();
          }
        })
      });
    }
  }

  RequestComplete() {
    const accessGroup = this.props.accessGroups[this.state.contractAddress];

    this.setState({
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
      submitRequestId: this.props.WrapRequest({
        todo: async () => {
          const contractAddress = await this.props.SaveAccessGroup({
            name: this.state.name,
            description: this.state.description,
            address: this.state.address,
            members: this.state.members
          });

          this.setState({contractAddress});
        }
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
    let redirectPath = Path.dirname(this.props.match.url);
    if(this.state.createForm) {
      // On creation, contract address won't exist until submission
      redirectPath = this.state.contractAddress ?
        Path.join(Path.dirname(this.props.match.url), this.state.contractAddress) : Path.dirname(this.props.match.url);
    }

    return (
      <RequestForm
        requests={this.props.requests}
        requestId={this.state.submitRequestId}
        legend={this.state.createForm ? "Create Access Group" : "Manage Access Group"}
        formContent={this.AccessGroupForm()}
        redirectPath={redirectPath}
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
          pageContent={this.PageContent}
          OnRequestComplete={this.RequestComplete}
        />
      );
    }
  }
}

export default AccessGroupForm;
