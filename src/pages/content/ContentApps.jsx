import React from "react";
import Path from "path";
import {PageHeader} from "@/components/Page";
import {LabelledField} from "@/components/LabelledField";
import {Action, Form, Modal} from "elv-components-js";
import FileUploadWidget from "@/components/FileUploadWidget";
import {observer} from "mobx-react";
import AsyncComponent from "@/components/AsyncComponent";
import ActionsToolbar from "@/components/ActionsToolbar";
import {libraryStore, objectStore} from "@/stores";

const appNames = {
  "asset-manager": "Asset Manager",
  "avails-manager": "Permissions Manager",
  "stream-sample": "Stream Sample"
};

class ContentApps extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      role: "",
      showUpload: false,
      pageVersion: 0
    };

    this.PageContent = this.PageContent.bind(this);
    this.HandleSubmit = this.HandleSubmit.bind(this);
  }

  async HandleSubmit() {
    await objectStore.UpdateApps({
      libraryId: objectStore.libraryId,
      objectId: objectStore.objectId,
      apps: this.state.apps
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
          encryptable={false}
          Upload={args => {
            this.setState({
              apps: {
                ...this.state.apps,
                [this.state.role]: {
                  ...this.state.apps[this.state.role],
                  appPath: args.fileList[0].name,
                  fileParams: args
                }
              }
            });
          }}
          OnCancel={closeModal}
          OnComplete={closeModal}
        />
      </Modal>
    );
  }

  AppRoles() {
    return ["display", "manage"];
  }

  Apps(role) {
    return (
      <LabelledField label="App">
        <select
          value={this.state.apps[role].appType}
          onChange={event => {
            this.setState({
              apps: {
                ...this.state.apps,
                [role]: {
                  appType: event.target.value,
                  appPath: ""
                }
              }
            });
          }}
        >
          <option value="">None</option>
          <option value="default">Default</option>
          {
            Object.keys((EluvioConfiguration["fabricBrowserApps"] || {}))
              .filter(appKey => appKey in appNames)
              .map(app =>
                <option key={`${role}-app-${app}`} value={app}>
                  { appNames[app] }
                </option>
              )
          }
          <option value="custom-url">Custom URL</option>
          <option value="custom-upload">Custom Upload</option>
        </select>
      </LabelledField>
    );
  }

  AppEntry(role) {
    return (
      <div key={"app-entry" + role}>
        <h3>
          {role.capitalize()} App
        </h3>
        <div className="indented">
          <div className="app-selection">
            { this.Apps(role) }
            {
              this.state.apps[role].appType === "custom-url" ?
                <LabelledField label="App URL">
                  <input
                    required
                    placeholder="App URL..."
                    value={this.state.apps[role].appPath}
                    onChange={event => {
                      this.setState({
                        apps: {
                          ...this.state.apps,
                          [role]: {...this.state.apps[role], appPath: event.target.value}
                        }
                      });
                    }}
                  />
                </LabelledField>
                : null
            }
            {
              this.state.apps[role].appType === "custom-upload" ?
                <React.Fragment>
                  <LabelledField label="App File">
                    { this.state.apps[role].appPath }
                  </LabelledField>
                  <LabelledField label="">
                    <Action onClick={() => this.setState({showUpload: true, role})} className="action-compact action-wide">
                      {`Upload ${role.capitalize()} App`}
                    </Action>
                  </LabelledField>
                </React.Fragment>
                : null
            }
          </div>
        </div>
      </div>
    );
  }

  PageContent() {
    const header = objectStore.object.isContentType ?
      "Content Types > " + objectStore.object.name :
      libraryStore.library.name + " > " + objectStore.object.name;

    return (
      <div className="page-container contracts-page-container">
        <ActionsToolbar
          showContentLookup={false}
          actions={[
            {
              label: "Back",
              type: "link",
              path: Path.dirname(this.props.match.url),
              className: "secondary"
            }
          ]}
        />
        <PageHeader header={header} />
        <div className="page-content-container">
          <div className="page-content">
            <Form
              legend="App Management"
              className="app-selection-form"
              OnSubmit={this.HandleSubmit}
              redirectPath={Path.dirname(this.props.match.url)}
              cancelPath={Path.dirname(this.props.match.url)}
            >
              <div className="label-box">
                { this.AppRoles().map(role => this.AppEntry(role))}
              </div>
            </Form>
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
            await libraryStore.ContentLibrary({
              libraryId: objectStore.libraryId,
            });

            await objectStore.ContentObject({
              libraryId: objectStore.libraryId,
              objectId: objectStore.objectId
            });

            let apps = {};
            const meta = objectStore.object.meta;
            this.AppRoles().map(role => {
              const app = (meta.public || {})[`eluv.${role}App`] || meta[`eluv.${role}App`];

              let appType;
              if(app === "default") {
                appType = "default";
              } else if((EluvioConfiguration["fabricBrowserApps"] || {})[app]) {
                appType = app;
              } else if(typeof app === "string" && (app.startsWith("http://") || app.startsWith("https://"))) {
                // App specification is a url
                appType = "custom-url";
              } else if(app) {
                appType = "custom-upload";
              }

              apps[role] = {
                appType,
                appPath: app
              };
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

export default observer(ContentApps);
