import React from "react";
import Path from "path";
import RequestPage from "../RequestPage";
import {PageHeader} from "../../components/Page";
import {LabelledField} from "../../components/LabelledField";
import RequestButton from "../../components/RequestButton";
import Action from "../../components/Action";

class ContentApps extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      libraryId: this.props.libraryId || this.props.match.params.libraryId,
      objectId: this.props.match.params.objectId
    };

    this.RequestComplete = this.RequestComplete.bind(this);
    this.PageContent = this.PageContent.bind(this);
    this.Reload = this.Reload.bind(this);
    this.DeleteApp = this.DeleteApp.bind(this);
  }

  AppRoles() {
    return ["display", "manage", "review"];
  }

  Reload() {
    this.setState({
      requestId: this.props.WrapRequest({
        todo: async () => {
          await this.props.GetContentLibrary({
            libraryId: this.state.libraryId
          });
          await this.props.GetContentObject({
            libraryId: this.state.libraryId,
            objectId: this.state.objectId
          });
        }
      })
    });
  }

  componentDidMount() {
    this.Reload();
  }

  RequestComplete() {
    const library = this.props.libraries[this.state.libraryId];
    const object = this.props.objects[this.state.objectId];
    const metadata = object.meta;

    let apps = {};
    this.AppRoles().map(role => {
      const appFile = metadata[`eluv.${role}App`];
      if(appFile) {
        apps[role] = {
          filename: appFile
        };
      }
    });

    this.setState({
      library,
      object,
      apps
    });
  }

  DeleteApp(role) {
    if(confirm(`Are you sure you want to remove the ${role} app?`)) {
      this.setState({
        deleteRequestId: this.props.WrapRequest({
          todo: async () => {
            await this.props.RemoveApp({
              libraryId: this.state.libraryId,
              objectId: this.state.objectId,
              role
            });

            this.Reload();
          }
        })
      });
    }
  }

  AppEntry(role) {
    const app = this.state.apps[role];

    let info;
    let action;
    if(app) {
      // App set for this role - remove button
      action = <RequestButton
        requests={this.props.requests}
        requestId={this.state.deleteRequestId}
        onClick={() => this.DeleteApp(role)}
        className="action delete-action action-compact action-wide"
        text={`Remove ${role.capitalize()} App`}
      />;
      info = <LabelledField label="Name" value={app.filename} />;
    } else {
      // App not set for this role - add button
      action = (
        <Action type="link" to={Path.join(this.props.match.url, role, "add")} className="action-compact action-wide">
          {`Add ${role.capitalize()} App`}
        </Action>
      );
      const typeMeta = (this.state.object.typeInfo && this.state.object.typeInfo.meta) || {};
      const typeApp = typeMeta[`eluv.${role}App`];
      if(typeApp) {
        const typeName = typeMeta.name || "content type";
        info = <LabelledField label="Name" value={`${typeApp} (${typeName})`} />;
      }
    }

    return (
      <div key={"app-entry" + role}>
        <h3>
          {role.capitalize()}
        </h3>
        <div className="indented">
          { info }
          <LabelledField
            value={
              <div className="actions-container">
                { action }
              </div>
            }
          />
        </div>
      </div>
    );
  }

  PageContent() {
    const header = this.state.object.isContentLibraryObject ?
      this.state.library.name + " > Library Object" :
      this.state.library.name + " > " + this.state.object.name;

    return (
      <div className="page-container contracts-page-container">
        <div className="actions-container">
          <Action type="link" to={Path.dirname(this.props.match.url)} className="secondary">Back</Action>
        </div>
        <div className="object-display">
          <PageHeader header={header} subHeader="App management" />
          <div className="label-box">
            { this.AppRoles().map(role => this.AppEntry(role))}
          </div>
        </div>
      </div>
    );
  }

  render() {
    return (
      <RequestPage
        pageContent={this.PageContent}
        requestId={this.state.requestId}
        requests={this.props.requests}
        OnRequestComplete={this.RequestComplete}
      />
    );
  }
}

export default ContentApps;
