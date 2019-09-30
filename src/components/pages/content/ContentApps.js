import React from "react";
import PropTypes from "prop-types";
import Path from "path";
import {PageHeader} from "../../components/Page";
import {LabelledField} from "../../components/LabelledField";
import {Action, Confirm, LoadingElement, Modal} from "elv-components-js";
import FileUploadWidget from "../../components/FileUploadWidget";

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
      apps,
      role: "",
      showUpload: false
    };

    this.PageContent = this.PageContent.bind(this);
    this.DeleteApp = this.DeleteApp.bind(this);
    this.HandleSubmit = this.HandleSubmit.bind(this);
  }

  async HandleSubmit(path, fileList, isDirectory) {
    await this.props.methods.Submit({
      libraryId: this.props.libraryId,
      objectId: this.props.objectId,
      role: this.state.role,
      isDirectory,
      fileList
    });
  }

  UploadModal() {
    if(!this.state.showUpload) { return null; }

    const closeModal = () => this.setState({showUpload: false});

    return (
      <Modal
        closable={true}
        OnClickOutside={closeModal}
      >
        <FileUploadWidget
          legend={`Upload ${this.state.role} Application`}
          path={this.state.path}
          displayPath={this.state.displayPath}
          files={this.props.files}
          uploadStatus={this.props.methodStatus.Submit}
          Upload={this.HandleSubmit}
          OnCancel={closeModal}
          OnComplete={() => {closeModal() ; this.props.Load();}}
        />
      </Modal>
    );
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
    let deleteButton;
    if(app) {
      // App set for this role - remove button
      deleteButton = (
        <Action onClick={() => this.DeleteApp(role)} className="action danger action-compact action-wide">
          {`Remove ${role.capitalize()} App`}
        </Action>
      );
      info = (
        <LabelledField label="Name">
          { app.filename }
        </LabelledField>
      );
    } else {

      const typeMeta = (this.props.object.typeInfo && this.props.object.typeInfo.meta) || {};
      const typeApp = typeMeta[`eluv.${role}App`];
      if(typeApp) {
        const typeName = typeMeta.name || "content type";
        info = (
          <LabelledField label="Name">
            { `${typeApp} (${typeName})` }
          </LabelledField>
        );
      }
    }

    action = (
      <Action onClick={() => this.setState({showUpload: true, role})} className="action-compact action-wide">
        {`Add ${role.capitalize()} App`}
      </Action>
    );

    return (
      <div key={"app-entry" + role}>
        <h3>
          {role.capitalize()}
        </h3>
        <div className="indented">
          { info }
          <LabelledField>
            { action }
            { deleteButton }
          </LabelledField>
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
        { this.UploadModal() }
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
