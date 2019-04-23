import React from "react";
import PropTypes from "prop-types";
import UrlJoin from "url-join";
import Path from "path";
import {PageHeader} from "../../components/Page";
import {LabelledField} from "../../components/LabelledField";
import {Action, Confirm, LoadingElement} from "elv-components-js";

class ContentApps extends React.Component {
  constructor(props) {
    super(props);

    let apps = {};
    this.AppRoles().map(role => {
      const appFile = props.object.meta[`eluv.${role}App`];
      if(appFile) {
        apps[role] = {
          filename: appFile
        };
      }
    });

    this.state = {
      apps
    };

    this.PageContent = this.PageContent.bind(this);
    this.DeleteApp = this.DeleteApp.bind(this);
  }

  AppRoles() {
    return ["display", "manage", "review"];
  }

  async DeleteApp(role) {
    await Confirm({
      message: `Are you sure you want to remove the ${role} app?`,
      onConfirm: async () => {
        await this.props.methods.RemoveApp({
          libraryId: this.props.libraryId,
          objectId: this.props.objectId,
          role
        });

        await this.props.Load();
      }
    });
  }

  AppEntry(role) {
    const app = this.state.apps[role];

    let info;
    let action;
    if(app) {
      // App set for this role - remove button
      action = (
        <Action onClick={() => this.DeleteApp(role)} className="action delete-action action-compact action-wide">
          {`Remove ${role.capitalize()} App`}
        </Action>
      );
      info = <LabelledField label="Name" value={app.filename} />;
    } else {
      // App not set for this role - add button
      action = (
        <Action type="link" to={UrlJoin(this.props.match.url, role, "add")} className="action-compact action-wide">
          {`Add ${role.capitalize()} App`}
        </Action>
      );
      const typeMeta = (this.props.object.typeInfo && this.props.object.typeInfo.meta) || {};
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
            value={action}
          />
        </div>
      </div>
    );
  }

  PageContent() {
    const header = this.props.object.isContentLibraryObject ?
      this.props.library.name + " > Library Object" :
      this.props.library.name + " > " + this.props.object.name;

    return (
      <div className="page-container contracts-page-container">
        <div className="actions-container">
          <Action type="link" to={Path.dirname(this.props.match.url)} className="secondary">Back</Action>
        </div>
        <PageHeader header={header} subHeader="App management" />
        <div className="page-content">
          <div className="label-box">
            { this.AppRoles().map(role => this.AppEntry(role))}
          </div>
        </div>
      </div>
    );
  }

  render() {
    return (
      <LoadingElement
        fullPage={true}
        render={this.PageContent}
        loading={this.props.methodStatus.RemoveApp.loading}
      />
    );
  }
}

ContentApps.propTypes = {
  libraryId: PropTypes.string.isRequired,
  library: PropTypes.object.isRequired,
  objectId: PropTypes.string.isRequired,
  object: PropTypes.object.isRequired,
  methods: PropTypes.shape({
    RemoveApp: PropTypes.func.isRequired
  })
};

export default ContentApps;
