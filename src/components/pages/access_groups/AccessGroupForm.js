import React from "react";
import UrlJoin from "url-join";
import Path from "path";
import {Action, Form} from "elv-components-js";
import {inject, observer} from "mobx-react";
import AsyncComponent from "../../components/AsyncComponent";
import JsonTextArea from "elv-components-js/src/components/JsonInput";
import {toJS} from "mobx";

@inject("groupStore")
@observer
class AccessGroupForm extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      createForm: !props.groupStore.contractAddress,
      name: "",
      description: "",
      isOauthGroup: false,
      oauthIssuer: "",
      oauthClaims: "",
      modifyMetadata: false,
      metadata: ""
    };

    this.PageContent = this.PageContent.bind(this);
    this.HandleInputChange = this.HandleInputChange.bind(this);
    this.HandleSubmit = this.HandleSubmit.bind(this);
  }

  HandleInputChange(event) {
    this.setState({
      [event.target.name]: event.target.value
    });
  }

  async HandleSubmit() {
    const contractAddress = await this.props.groupStore.SaveAccessGroup({
      address: this.props.groupStore.contractAddress,
      name: this.state.name,
      description: this.state.description,
      metadata: this.state.metadata,
      oauthIssuer: this.state.oauthIssuer,
      oauthClaims: this.state.oauthClaims
    });

    this.setState({
      contractAddress,
    });
  }

  OauthInfo() {
    if(!this.state.isOauthGroup) {
      return null;
    }

    return (
      <React.Fragment>
        <label htmlFor="oauthIssuer">Issuer</label>
        <input name="oauthIssuer" value={this.state.oauthIssuer} onChange={this.HandleInputChange} />

        <label htmlFor="oauthClaims" className="align-top">Claims</label>
        <JsonTextArea name="oauthClaims" value={this.state.oauthClaims} onChange={this.HandleInputChange} />
      </React.Fragment>
    );
  }

  Metadata() {
    if(!this.state.modifyMetadata) {
      return null;
    }

    return (
      <React.Fragment>
        <label htmlFor="metadata" className="align-top">Metadata</label>
        <JsonTextArea name="metadata" value={this.state.metadata} onChange={this.HandleInputChange} />
      </React.Fragment>
    );
  }

  PageContent() {
    const backPath = Path.dirname(this.props.match.url);
    const redirectPath = this.state.createForm ? UrlJoin(backPath, this.state.contractAddress || "") : backPath;

    return (
      <div>
        <div className="actions-container manage-actions">
          <Action type="link" to={Path.dirname(this.props.match.url)} className="secondary">Back</Action>
        </div>
        <Form
          legend={this.state.createForm ? "Create Access Group" : "Manage Access Group"}
          redirectPath={redirectPath}
          cancelPath={backPath}
          OnSubmit={this.HandleSubmit}
        >
          <div className="form-content">
            <label htmlFor="name">Name</label>
            <input name="name" value={this.state.name} onChange={this.HandleInputChange} />

            <label htmlFor="description" className="align-top">Description</label>
            <textarea name="description" value={this.state.description} onChange={this.HandleInputChange} />

            <label htmlFor="modifyMetadata">Edit Metadata</label>
            <input
              name="modifyMetadata"
              type="checkbox"
              checked={this.state.modifyMetadata}
              onChange={() => this.setState({modifyMetadata: !this.state.modifyMetadata})}
            />

            { this.Metadata() }

            <label htmlFor="isOauthGroup">Link with OAuth</label>
            <input
              name="isOauthGroup"
              type="checkbox"
              checked={this.state.isOauthGroup}
              onChange={() => this.setState({isOauthGroup: !this.state.isOauthGroup})}
            />

            { this.OauthInfo() }
          </div>
        </Form>
      </div>
    );
  }

  render() {
    return (
      <AsyncComponent
        Load={
          async () => {
            if(!this.state.createForm) {
              await this.props.groupStore.AccessGroup({
                contractAddress: this.props.groupStore.contractAddress
              });

              const group = this.props.groupStore.accessGroup;

              this.setState({
                name: group.name,
                metadata: JSON.stringify(toJS(group.metadata), null, 2),
                description: group.description,
                isOauthGroup: !!group.oauthIssuer,
                oauthIssuer: group.oauthIssuer || "",
                oauthClaims: group.oauthClaims || ""
              });
            }
          }
        }
        render={this.PageContent}
      />
    );
  }
}

export default AccessGroupForm;
