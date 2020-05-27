import React from "react";
import UrlJoin from "url-join";
import Path from "path";
import {Action, Form, IconButton} from "elv-components-js";
import {inject, observer} from "mobx-react";
import AsyncComponent from "../../components/AsyncComponent";
import JsonTextArea from "elv-components-js/src/components/JsonInput";
import {toJS} from "mobx";
import Fabric from "../../../clients/Fabric";

import AddIcon from "../../../static/icons/plus-square.svg";
import RemoveIcon from "../../../static/icons/minus-square.svg";

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
      oauthAud: "",
      oauthGroups: [],
      trustAuthorityId: "",
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
      oauthEnabled: this.state.isOauthGroup,
      oauthIssuer: this.state.oauthIssuer,
      oauthAud: this.state.oauthAud,
      oauthGroups: this.state.oauthGroups,
      trustAuthorityId: this.state.trustAuthorityId
    });

    this.setState({
      contractAddress,
    });
  }

  OAuthGroups() {
    const onChange = (event, i) => {
      let groups = this.state.oauthGroups;
      groups[i] = event.target.value;
      this.setState({oauthGroups: groups});
    };

    return (
      <React.Fragment>
        <label>OAuth Groups</label>

        { this.state.oauthGroups.map((groupName, i) => (
          <React.Fragment key={`oauthGroup-${i}`}>
            <span className="flex">
              <input className="flex-grow" value={groupName} onChange={event => onChange(event, i)} />
              <IconButton
                icon={RemoveIcon}
                className="oauth-group-icon"
                title="Remove Group"
                onClick={() => {
                  let groups = this.state.oauthGroups;
                  groups = groups.filter((_, k) => i !== k);
                  this.setState({oauthGroups: groups});
                }}
              />
            </span>
            <label />
          </React.Fragment>
        ))}

        <IconButton
          icon={AddIcon}
          className="oauth-group-icon"
          title="Add Group"
          onClick={() => {
            let groups = this.state.oauthGroups;
            groups.push("");
            this.setState({oauthGroups: groups});
          }}
        />

      </React.Fragment>
    );
  }

  OauthInfo() {
    if(!this.state.isOauthGroup) {
      return null;
    }

    return (
      <React.Fragment>
        <label htmlFor="trustAuthorityId">Trust Authority Id</label>
        <input name="trustAuthorityId" value={this.state.trustAuthorityId} onChange={this.HandleInputChange} />

        <label htmlFor="oauthIssuer">OAuth Issuer</label>
        <input name="oauthIssuer" value={this.state.oauthIssuer} onChange={this.HandleInputChange} />

        <label htmlFor="oauthAud">OAuth AUD</label>
        <input name="oauthAud" value={this.state.oauthAud} onChange={this.HandleInputChange} />

        { this.OAuthGroups() }
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
      <div className="page-content-container">
        <div className="page-content">
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
                checked={!!this.state.isOauthGroup}
                onChange={() => this.setState({isOauthGroup: !this.state.isOauthGroup})}
              />

              { this.OauthInfo() }
            </div>
          </Form>
        </div>
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
                isOauthGroup: group.oauthInfo && group.oauthInfo.oauthEnabled,
                oauthIssuer: group.oauthInfo && group.oauthInfo.issuer || "",
                oauthAud: group.oauthInfo && group.oauthInfo.claims && group.oauthInfo.claims.aud || "",
                oauthGroups: group.oauthInfo && group.oauthInfo.claims && toJS(group.oauthInfo.claims.groups) || [],
                trustAuthorityId: group.oauthInfo && group.oauthInfo.trustAuthorityId || ""
              });
            }

            if(!this.state.trustAuthorityId) {
              this.setState({
                trustAuthorityId: await Fabric.DefaultKMSId()
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
