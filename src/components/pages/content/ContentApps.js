import React from "react";
import Path from "path";
import {PageHeader} from "../../components/Page";
import {LabelledField} from "../../components/LabelledField";
import {Action, AsyncComponent, Confirm, Modal} from "elv-components-js";
import FileUploadWidget from "../../components/FileUploadWidget";
import {inject, observer} from "mobx-react";

@inject("libraryStore")
@inject("objectStore")
@observer
class ContentApps extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      role: "",
      showUpload: false,
      pageVersion: 0
    };

    this.PageContent = this.PageContent.bind(this);
    this.DeleteApp = this.DeleteApp.bind(this);
    this.HandleSubmit = this.HandleSubmit.bind(this);
  }

  async HandleSubmit(path, fileList, isDirectory) {
    await this.props.objectStore.AddApp({
      libraryId: this.props.objectStore.libraryId,
      objectId: this.props.objectStore.objectId,
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
          Upload={this.HandleSubmit}
          OnCancel={closeModal}
          OnComplete={() => {
            closeModal();
            this.setState({pageVersion: this.state.pageVersion + 1});
          }}
        />
      </Modal>
    );
  }

  AppRoles() {
    return ["display", "manage"];
  }

  async DeleteApp(role) {
    await Confirm({
      message: `Are you sure you want to remove the ${role} app?`,
      onConfirm: async () => {
        await this.props.objectStore.RemoveApp({
          libraryId: this.props.objectStore.libraryId,
          objectId: this.props.objectStore.objectId,
          role
        });

        this.setState({pageVersion: this.state.pageVersion + 1});
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

      const typeMeta = (this.props.objectStore.object.typeInfo && this.props.objectStore.object.typeInfo.meta) || {};
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
    const header = this.props.objectStore.object.isContentLibraryObject ?
      this.props.libraryStore.library.name + " > Library Object" :
      this.props.libraryStore.library.name + " > " + this.props.objectStore.object.name;

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
      <AsyncComponent
        key={`apps-page-${this.state.pageVersion}`}
        Load={
          async () => {
            await this.props.libraryStore.ContentLibrary({
              libraryId: this.props.objectStore.libraryId,
            });

            await this.props.objectStore.ContentObject({
              libraryId: this.props.objectStore.libraryId,
              objectId: this.props.objectStore.objectId
            });

            let apps = {};
            this.AppRoles().map(role => {
              const appFile = this.props.objectStore.object.meta[`eluv.${role}App`];

              if(appFile) {
                apps[role] = {
                  filename: appFile
                };
              }
            });

            this.setState({
              apps
            });
          }
        }
        render={this.PageContent}
      />
    );
  }
}

export default ContentApps;
