import React from "react";
import RequestForm from "../../forms/RequestForm";
import RequestPage from "../RequestPage";
import Path from "path";

class AccountInfoForm extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      accountAddress: this.props.match.params.accountAddress,

      name: "",
      profileImageFile: "",
      profileImagePreviewUrl: "asd",
      bio: ""
    };

    this.FormContent = this.FormContent.bind(this);
    this.HandleInputChange = this.HandleInputChange.bind(this);
    this.HandleSubmit = this.HandleSubmit.bind(this);
    this.OnAccountInfoLoaded = this.OnAccountInfoLoaded.bind(this);
  }

  componentDidMount() {
    let pageRequestId = this.props.GetAccountInfo({
      accountAddress: this.state.accountAddress
    });

    this.setState({
      pageRequestId
    });
  }

  async HandleInputChange(event) {
    const target = event.target;
    if(target.name === "profileImage") {
      const data = await new Response(target.files[0]).blob();
      this.setState({
        profileImageFile: target.files[0],
        profileImagePreviewUrl: window.URL.createObjectURL(data)
      });
    } else {
      this.setState({
        [target.name]: target.value
      });
    }
  }

  HandleSubmit() {
    let formRequestId = this.props.UpdateAccountInfo({
      accountAddress: this.state.accountAddress,
      name: this.state.name,
      bio: this.state.bio,
      profileImageFile: this.state.profileImageFile
    });

    this.setState({ formRequestId });
  }

  OnAccountInfoLoaded() {
    let accountInfo = this.props.accountInfo[this.state.accountAddress];

    if(accountInfo) {
      this.setState({
        name: accountInfo.metadata.name,
        bio: accountInfo.metadata.bio
      });
    }
  }

  ProfileImagePreview() {
    if(!this.state.profileImageFile) { return null; }

    return(
      <img className="image-preview" src={this.state.profileImagePreviewUrl} />
    );
  }

  FormContent() {
    return (
      <div className="form-content">
        { this.ProfileImagePreview() }
        <div className="labelled-input">
          <label htmlFor="profileImage">Profile Image</label>
          <input
            type="file"
            name="profileImage"
            onChange={this.HandleInputChange}
            accept="image/*"
          />
        </div>
        <div className="labelled-input">
          <label htmlFor="name">Name</label>
          <input type="text" name="name" value={this.state.name} onChange={this.HandleInputChange} />
        </div>
        <div className="labelled-input">
          <label className="textarea-label" htmlFor="bio">Bio</label>
          <textarea name="bio" value={this.state.bio} onChange={this.HandleInputChange} />
        </div>
      </div>
    );
  }

  PageContent() {
    return (
      <RequestForm
        requests={this.props.requests}
        requestId={this.state.formRequestId}
        legend="Edit your account"
        formContent={this.FormContent()}
        redirect={this.state.finished}
        redirectPath={Path.join("/accounts", this.state.accountAddress)}
        cancelPath={Path.join("/accounts", this.state.accountAddress)}
        OnSubmit={this.HandleSubmit}
      />
    );
  }

  render() {
    return (
      <RequestPage
        pageContent={this.PageContent()}
        requestId={this.state.pageRequestId}
        requests={this.props.requests}
        OnRequestComplete={this.OnAccountInfoLoaded}
      />
    );
  }
}

export default AccountInfoForm;
