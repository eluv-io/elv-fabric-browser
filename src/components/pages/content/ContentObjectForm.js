import React from "react";
import UrlJoin from "url-join";
import Path from "path";
import {Action, BrowseWidget, Form, JsonInput, LoadingElement, Tabs} from "elv-components-js";
import {inject, observer} from "mobx-react";
import AsyncComponent from "../../components/AsyncComponent";
import {Redirect} from "react-router";
import {toJS} from "mobx";
import Fabric from "../../../clients/Fabric";
import AppFrame from "../../components/AppFrame";

@inject("libraryStore")
@inject("objectStore")
@inject("typeStore")
@observer
class ContentObjectForm extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      createForm: !props.objectStore.objectId,
      name: "",
      description: "",
      publicMetadata: "{}",
      privateMetadata: "{}",
      type: "",
      types: {},
      imageSelection: "",
      objectId: "",
      commitMessage: "",
      showManageApp: false
    };

    this.PageContent = this.PageContent.bind(this);
    this.HandleInputChange = this.HandleInputChange.bind(this);
    this.HandleImageChange = this.HandleImageChange.bind(this);
    this.HandleSubmit = this.HandleSubmit.bind(this);
  }

  HandleInputChange(event) {
    this.setState({
      [event.target.name]: event.target.value
    });
  }

  HandleImageChange(event) {
    if(event.target.files) {
      this.setState({
        imageSelection: event.target.files[0]
      });
    }
  }

  async HandleSubmit() {
    const objectId = await this.props.objectStore.UpdateContentObject({
      libraryId: this.props.libraryStore.libraryId,
      objectId: this.props.objectStore.objectId,
      type: this.state.type,
      name: this.state.name,
      description: this.state.description,
      publicMetadata: this.state.publicMetadata,
      privateMetadata: this.state.privateMetadata,
      image: this.state.imageSelection,
      commitMessage: this.state.commitMessage
    });

    this.setState({
      objectId
    });
  }

  Image() {
    return [
      <label key="image-selection-label" htmlFor="imageSelection" className="align-top">Image</label>,
      <BrowseWidget
        key="image-selection"
        name="image"
        required={false}
        multiple={false}
        accept="image/*"
        preview={true}
        onChange={this.HandleImageChange}
      />
    ];
  }

  Types() {
    const currentType = this.props.objectStore.object && this.props.objectStore.object.typeInfo && this.props.objectStore.object.typeInfo.hash;

    if(currentType && !this.state.types[currentType]) {
      const currentTypeId = Fabric.utils.DecodeVersionHash(currentType).objectId;
      const latestType = Object.values(this.state.types).find(({id}) => id === currentTypeId);

      if(latestType) {
        const latestTypeInfo = { ...this.state.types[latestType.hash] };
        latestTypeInfo.name = `${latestTypeInfo.name || latestTypeInfo.hash} (latest)`;
        this.state.types[latestType.hash] = latestTypeInfo;
      }

      this.state.types[currentType] = {
        id: currentTypeId,
        hash: currentType,
        name: `${this.props.objectStore.object.typeInfo.name || currentType} (current)`
      };
    }

    const options = Object.values(this.state.types)
      .sort((a, b) => (a.name || `zzz${a.hash}`).toLowerCase() < (b.name || `zzz${b.hash}`).toLowerCase() ? -1 : 1)
      .map(({name, hash}) => <option key={`type-${hash}`} value={hash}>{ name || hash }</option>);

    return (
      <React.Fragment>
        <label htmlFor="type">Type</label>
        <LoadingElement loading={!this.props.typeStore.typesLoaded}>
          <select name="type" value={this.state.type} onChange={this.HandleInputChange}>
            { options }
          </select>
        </LoadingElement>
      </React.Fragment>
    );
  }

  FormContent(legend, redirectPath, backPath) {
    return (
      <Form
        legend={legend}
        redirectPath={redirectPath}
        cancelPath={backPath}
        OnSubmit={this.HandleSubmit}
      >
        <div className="form-content">
          <label htmlFor="name">Name</label>
          <input name="name" value={this.state.name} required={true} onChange={this.HandleInputChange} disabled={this.state.isContentSpaceLibrary} />

          { this.Types() }

          { this.Image() }

          <label className="align-top" htmlFor="description">Description</label>
          <textarea name="description" value={this.state.description} onChange={this.HandleInputChange} />

          <label className="align-top" htmlFor="publicMetadata">Public Metadata</label>
          <JsonInput
            name="publicMetadata"
            value={this.state.publicMetadata}
            onChange={this.HandleInputChange}
          />

          <label className="align-top" htmlFor="privateMetadata">Private Metadata</label>
          <JsonInput
            name="privateMetadata"
            value={this.state.privateMetadata}
            onChange={this.HandleInputChange}
          />

          <label htmlFor="commitMessage">Commit Message</label>
          <textarea name="commitMessage" value={this.state.commitMessage} onChange={this.HandleInputChange} />
        </div>
      </Form>
    );
  }

  AppFormSelection() {
    if(this.state.createForm || !this.state.manageAppUrl || this.state.fullScreen) { return null; }

    return (
      <Tabs
        className="object-form-tabs"
        selected={this.state.showManageApp}
        onChange={(value) => this.setState({showManageApp: value})}
        options={[["App", true], ["Form", false]]}
      />
    );
  }

  BackLink() {
    if(this.state.fullScreen) { return; }

    return (
      <div className="actions-container manage-actions">
        <Action type="link" to={Path.dirname(this.props.match.url)} className="secondary">Back</Action>
      </div>
    );
  }

  AppFrame() {
    const queryParams = {
      contentSpaceId: Fabric.contentSpaceId,
      libraryId: this.props.objectStore.libraryId,
      objectId: this.props.objectStore.objectId,
      versionHash: this.props.objectStore.object.hash,
      type: this.props.objectStore.object.type,
      action: "manage"
    };

    return (
      <AppFrame
        appUrl={this.state.manageAppUrl}
        queryParams={queryParams}
        onComplete={() => this.setState({completed: true})}
        onCancel={() => this.setState({completed: true})}
        Reload={() => this.setState({pageVersion: this.state.pageVersion + 1})}
        className="form-frame"
      />
    );
  }

  PageContent() {
    const legend = this.state.createForm ? "Contribute content" : `Manage ${this.state.name || "content"}`;

    let redirectPath = Path.dirname(this.props.match.url);
    if(this.state.createForm) {
      redirectPath = UrlJoin(Path.dirname(this.props.match.url), this.state.objectId);
    }
    const cancelPath = Path.dirname(this.props.match.url);

    if(this.state.completed) {
      return <Redirect push to={redirectPath} />;
    }

    let content;
    if(this.state.manageAppUrl && this.state.showManageApp) {
      content = this.AppFrame(legend);
    } else {
      content = this.FormContent(legend, redirectPath, cancelPath);
    }

    return (
      <div className="page-container">
        { this.BackLink() }
        <div className="page-content-container">
          <div className={`page-content ${this.state.showManageApp ? "no-padding" : ""}`}>
            { this.AppFormSelection() }
            { content }
          </div>
        </div>
      </div>
    );
  }

  render() {
    return (
      <AsyncComponent
        key={`content-object-form-${this.state.pageVersion}`}
        Load={
          async () => {
            let loadTasks = [];

            // Don't wait for types
            const LoadTypes = async () => {
              await this.props.typeStore.ContentTypes();

              // Wait for library load to complete
              let waited = 0;
              while(!this.props.libraryStore.library) {
                if(waited > 5000) { return; }

                await new Promise(resolve => setTimeout(resolve, 250));
                waited += 250;
              }

              let allowedTypes = {};
              Object.values(this.props.libraryStore.library.types).forEach(type => allowedTypes[type.hash] = type);

              let initialType = "";
              let types = {};
              if(Object.keys(allowedTypes).length > 0) {
                // Allowed types specified on library - limit options to that list
                initialType = Object.values(allowedTypes)
                  .sort((a, b) => (a.name || `zzz${a.hash}`).toLowerCase() < (b.name || `zzz${b.hash}`).toLowerCase() ? -1 : 1)[0].hash;
                types = allowedTypes;
              } else {
                // No allowed types specified on library - all types allowed
                Object.values(this.props.typeStore.allTypes).forEach(type => types[type.hash] = type);
                types[""] = { name: "<None>", hash: "" };
              }

              this.setState({type: this.state.type || initialType, types: { ...toJS(types) }});
            };

            LoadTypes();

            loadTasks.push(
              async () => await this.props.libraryStore.ContentLibrary({
                libraryId: this.props.objectStore.libraryId
              })
            );

            if(this.props.objectStore.objectId) {
              loadTasks.push(
                async () => await this.props.objectStore.ContentObject({
                  libraryId: this.props.objectStore.libraryId,
                  objectId: this.props.objectStore.objectId
                })
              );
            }

            await Promise.all(loadTasks.map(async task => await task()));

            if(this.props.objectStore.objectId) {
              const object = this.props.objectStore.object;
              const meta = {...toJS(object.meta)};
              const publicMetadata = JSON.stringify(meta.public || {}, null, 2);
              delete meta.public;
              const privateMetadata = JSON.stringify(meta, null, 2);

              const manageAppUrl = object.manageAppUrl || (object.typeInfo || {}).manageAppUrl;
              this.setState({
                type: (object.typeInfo || {}).hash || "",
                name: object.name || "",
                description: object.description || "",
                publicMetadata,
                privateMetadata,
                manageAppUrl,
                showManageApp: !!manageAppUrl
              });
            }
          }
        }
        render={this.PageContent}
      />
    );
  }
}

export default ContentObjectForm;
