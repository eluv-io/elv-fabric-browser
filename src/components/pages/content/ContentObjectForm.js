import React from "react";
import {
  Action,
  BrowseWidget,
  Form,
  JsonInput,
  IconButton,
  RadioSelect,
  Tabs, AsyncComponent
} from "elv-components-js";
import UrlJoin from "url-join";
import Path from "path";
import {InitializeSchema, GetValue, SetValue, RemoveValue} from "../../../utils/TypeSchema";
import Id from "../../../utils/Id";
import TrashIcon from "../../../static/icons/trash.svg";
import {DownloadFromUrl} from "../../../utils/Files";
import Fabric from "../../../clients/Fabric";
import AppFrame from "../../components/AppFrame";
import {Redirect} from "react-router";
import {inject, observer} from "mobx-react";
import {Percentage} from "../../../utils/Helpers";
import {toJS} from "mobx";

import MaximizeIcon from "../../../static/icons/maximize.svg";
import MinimizeIcon from "../../../static/icons/minimize.svg";

const defaultSchema = [
  {
    "key": "public",
    "type": "object",
    "flattenDisplay": true,
    "fields": [
      {
        "key": "name",
        "label": "Name",
        "type": "string"
      },
      {
        "key": "description",
        "label": "Description",
        "type": "text"
      },
    ]
  }
];

// Build a form from a JSON schema
@inject("libraryStore")
@inject("objectStore")
@inject("typeStore")
@observer
class ContentObjectForm extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      completed: false,
      metadata: "",
      publicMetadata: "",
      uploadStatus: {},
      imageSelection: undefined,
      isDefault: true,
      fullScreen: false,
      pageVersion: 0
    };

    this.PageContent = this.PageContent.bind(this);
    this.HandleImageChange = this.HandleImageChange.bind(this);
    this.HandleInputChange = this.HandleInputChange.bind(this);
    this.HandleFieldChange = this.HandleFieldChange.bind(this);
    this.HandleSubmit = this.HandleSubmit.bind(this);
    this.HandleTypeChange = this.HandleTypeChange.bind(this);
    this.RemoveElement = this.RemoveElement.bind(this);
    this.FrameCompleted = this.FrameCompleted.bind(this);
    this.UploadStatusCallback = this.UploadStatusCallback.bind(this);
  }

  FormatType(type) {
    // Skip "none" type
    if(!type.hash) { return type; }

    const typeName = (type.meta && type.meta.public && type.meta.public.name) || type.hash;

    return {
      ...type,
      name: typeName,
      schema: type.meta && type.meta["eluv.schema"],
      allowCustomMetadata: type.meta && type.meta["eluv.allowCustomMetadata"],
    };
  }

  Initialize() {
    let type = "";
    let types = {};

    let metadata = "";
    let publicMetadata = "";
    let accessCharge = 0;

    let allowedTypes = {};
    Object.values(this.props.libraryStore.library.types).forEach(type => allowedTypes[type.hash] = type);

    if(Object.keys(allowedTypes).length > 0) {
      // Allowed types specified on library - limit options to that list
      type = Object.values(allowedTypes)[0].hash;
      types = allowedTypes;
    } else {
      // No allowed types specified on library - all types allowed
      Object.values(this.props.typeStore.allTypes).forEach(type => types[type.hash] = type);
    }

    Object.values(types).forEach(type => types[type.hash] = this.FormatType(type));

    const object = this.props.objectStore.object;

    if(object) {
      const meta = {...toJS(object.meta)};
      publicMetadata = JSON.stringify(meta.public || {}, null, 2);
      delete meta.public;
      metadata = JSON.stringify(meta, null, 2);

      accessCharge = object.accessInfo && object.accessInfo.accessCharge;

      type = object.type;
      if(object.typeInfo) {
        if(!types[object.typeInfo.latestTypeHash]) {
          types[object.typeInfo.latestTypeHash] = this.FormatType(object.typeInfo);
        }

        type = object.typeInfo.latestTypeHash;
      }
    }

    this.setState({
      types,
      type,
      metadata,
      publicMetadata,
      accessCharge
    });

    this.SwitchType(types, type);

    if(!this.state.createForm && this.state.manageAppUrl) {
      this.setState({showManageApp: true});
    }
  }

  SwitchType(types, type) {
    const object = this.props.objectStore.object;
    let typeOptions = type && types[type] || {};

    let manageAppUrl;
    let showManageApp = false;
    let schema = typeOptions.schema || defaultSchema;
    let isDefault = !typeOptions.schema;
    if(object && object.manageAppUrl && !object.isContentType) {
      manageAppUrl = object.manageAppUrl;
    } else if(typeOptions.manageAppUrl) {
      manageAppUrl = typeOptions.manageAppUrl;
    }

    const allowCustomMetadata = typeOptions.schema ? typeOptions.allowCustomMetadata : true;
    const data = this.state.createForm ? undefined : object.meta;

    const initialFields = InitializeSchema({schema, initialData: data});

    this.setState({
      type,
      fields: initialFields,
      schema: schema,
      isDefault,
      allowCustomMetadata,
      manageAppUrl,
      showManageApp
    });
  }

  HandleImageChange(event) {
    if(event.target.files) {
      this.setState({
        imageSelection: event.target.files[0]
      });
    }
  }

  HandleInputChange(event) {
    this.setState({
      [event.target.name]: event.target.value
    });
  }

  HandleTypeChange(event) {
    this.SwitchType(this.state.types, event.target.value);
  }

  HandleFieldChange(event, entry, subtree=[]) {
    let value = event.target.value;
    if(entry.type === "file") {
      value = event.target.files;
    } else if(entry.type === "boolean") {
      value = event.target.checked;
    }

    this.setState({
      fields: SetValue({
        data: this.state.fields,
        subtree,
        attr: entry.key,
        value
      })
    });
  }

  RemoveElement(subtree, attr) {
    this.setState({
      fields: RemoveValue({
        data: this.state.fields,
        subtree,
        attr
      })
    });
  }

  UploadStatusCallback({key, uploaded, total, filename}) {
    const progress = Percentage(uploaded, total);

    this.setState({
      uploadStatus: {
        ...this.state.uploadStatus,
        [key]: {
          ...(this.state.uploadStatus || {})[key],
          [filename]: progress
        }
      }
    });
  }

  async HandleSubmit() {
    const type = this.state.type === "[none]" ? "" : this.state.type;

    const objectId = await this.props.objectStore.UpdateFromContentTypeSchema({
      type,
      libraryId: this.props.objectStore.libraryId,
      objectId: this.props.objectStore.objectId,
      schema: this.state.schema,
      fields: this.state.fields,
      metadata: this.state.metadata,
      publicMetadata: this.state.publicMetadata,
      image: this.state.imageSelection,
      accessCharge: this.state.accessCharge,
      callback: this.UploadStatusCallback
    });

    this.setState({objectId});
  }

  Image() {
    if(!this.state.isDefault) { return; }

    return (
      <React.Fragment>
        <label key="image-selection-label" htmlFor="imageSelection" className="align-top">Image</label>
        <BrowseWidget
          key="image-selection"
          name="image"
          required={false}
          multiple={false}
          accept="image/*"
          preview={true}
          onChange={this.HandleImageChange}
        />
      </React.Fragment>
    );
  }

  TypeField() {
    const types = Object.values(this.state.types).sort((a, b) => a.name.toLowerCase() > b.name.toLowerCase() ? 1 : -1);
    let options = types.map(({name, hash}) => {
      return <option key={"type-" + hash} name="type" value={hash}>{ name }</option>;
    });

    // If library types not restricted, allow creation of objects with no type
    if(!this.props.libraryStore.library.types || Object.keys(this.props.libraryStore.library.types).length === 0) {
      options.unshift(
        <option key="type-none" name="type" value="">[none]</option>
      );
    }

    return [
      <label key="type-field-label" htmlFor="type">Content Type</label>,
      <select key="type-field" name="type" value={this.state.type} onChange={this.HandleTypeChange}>
        { options }
      </select>
    ];
  }

  BuildField(entry, subtree=[]) {
    const onChange = (event) => this.HandleFieldChange(event, entry, subtree);

    const key = `field-${this.state.type}-${subtree.join("-")}-${entry.key}`;
    const value = GetValue({data: this.state.fields, subtree, attr: entry.key});

    // Compare with undefined to allow blank labels
    const label = entry.label !== undefined ? entry.label : entry.key;

    let field;
    switch(entry.type) {
      case "label":
        field = <div key={key} className="form-text">{entry.text}</div>;
        break;
      case "attachedFile":
        field = (
          <Action
            key={key}
            className="action-compact secondary action-full-width"
            onClick={
              async () => {
                const type = this.state.types[this.state.type];
                if(entry.hash) {
                  await this.props.objectStore.DownloadPart({
                    libraryId: Fabric.contentSpaceLibraryId,
                    objectId: type.id,
                    versionHash: type.hash,
                    partHash: entry.hash,
                    callback: async (url) => {
                      await DownloadFromUrl(url, entry.filename || label);
                    }
                  });
                }
              }
            }
          >
            Download
          </Action>
        );
        break;
      case "string":
        field = <input key={key} name={entry.key} required={entry.required} value={value} onChange={onChange} />;
        break;
      case "text":
        field = <textarea key={key} name={entry.key} required={entry.required} value={value} onChange={onChange} />;
        break;
      case "integer":
        field = <input key={key} name={entry.key} required={entry.required} value={value} type="number" step={1} onChange={onChange} />;
        break;
      case "number":
        field = <input key={key} name={entry.key} required={entry.required} value={value} type="number" step={0.000000000001} onChange={onChange} />;
        break;
      case "boolean":
        field = (
          <input key={key} name={entry.key} required={entry.required} checked={value} type="checkbox" onChange={onChange} />
        );
        break;
      case "choice":
        return <RadioSelect
          key={key}
          name={entry.key}
          required={entry.required}
          selected={value}
          options={entry.options}
          onChange={onChange}
        />;
      case "json":
        field = <JsonInput
          key={key}
          name={entry.key}
          value={value}
          onChange={event => this.HandleFieldChange(event, entry, subtree)}
        />;
        break;
      case "file":
        const required = entry.required && this.state.createForm;

        field = (
          <BrowseWidget
            key={key}
            accept={entry.accept}
            name={entry.key}
            onChange={onChange}
            multiple={entry.multiple}
            required={required}
            preview={entry.preview}
            progress={this.state.uploadStatus[entry.key] || {}}
          />
        );
        break;

      case "list":
        const elements = Object.keys(value).map(index => {
          const element = {
            key: index,
            type: "list-element"
          };
          return this.BuildField(element, subtree.concat(entry.key));
        });
        field = (
          <div key={key} className="full-width">
            <Action
              onClick={() => this.HandleFieldChange({target: {value: ""}}, {key: Id.next()}, subtree.concat(entry.key))}
            >
              Add Element
            </Action>
            <div className="list">
              {elements}
            </div>
          </div>
        );
        break;
      case "list-element":
        return (
          <div key={key} className="list-item">
            <input name={entry.key} required={entry.required} value={value} onChange={onChange} />
            <IconButton
              icon={TrashIcon}
              label="Remove Element"
              onClick={() => this.RemoveElement(subtree, entry.key)}
            />
          </div>
        );
      case "object":
        const fields = this.BuildType(entry.fields, subtree.concat([entry.key]));
        if(entry.flattenDisplay) {
          // Show fields at top level instead of nested in object's label
          return fields;
        } else {
          field = (
            <div key={key} className="form-content no-margins">
              {fields}
            </div>
          );
        }
    }

    return [
      <label key={key + "-label"} className={["label", "list", "text", "json", "object", "file"].includes(entry.type) ? "align-top" : ""} htmlFor={name}>{label}</label>,
      field
    ];
  }

  BuildType(schema, subtree=[]) {
    return schema.map(entry => this.BuildField(entry, subtree));
  }

  MetadataField() {
    return (
      <React.Fragment>
        <label className="align-top">Metadata</label>
        <JsonInput
          onChange={this.HandleInputChange}
          name="metadata"
          value={this.state.metadata}
        />
      </React.Fragment>
    );
  }

  PublicMetadataField() {
    return (
      <React.Fragment>
        <label className="align-top">Public Metadata</label>
        <JsonInput
          onChange={this.HandleInputChange}
          name="publicMetadata"
          value={this.state.publicMetadata}
        />
      </React.Fragment>
    );
  }

  AccessChargeField() {
    return [
      <label key="access-charge-label" htmlFor="accessCharge">Access Charge</label>,
      <input key="access-charge" type="number" step={0.0000001} name="accessCharge" value={this.state.accessCharge || 0} onChange={this.HandleInputChange} />
    ];
  }

  FrameCompleted() {
    this.setState({completed: true});
  }

  AppFormSelection() {
    if(this.state.createForm || !this.state.manageAppUrl || this.state.fullScreen) { return null; }

    return (
      <Tabs
        className="compact"
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

  FullscreenButton() {
    const icon = this.state.fullScreen ? MinimizeIcon : MaximizeIcon;
    const title = this.state.fullScreen ? "Show form options" : "Hide form options";

    return (
      <IconButton
        icon={icon}
        title={title}
        className="fullscreen-button"
        onClick={() => this.setState({fullScreen: !this.state.fullScreen})}
      />
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
      <React.Fragment>
        { this.BackLink() }
        <form className={`app-form ${this.state.fullScreen ? "app-form-fullscreen" : ""}`}>
          { this.FullscreenButton() }
          <div role="group" className="app-form-fieldset">
            { this.AppFormSelection() }
            <br />
            <AppFrame
              appUrl={this.state.manageAppUrl}
              queryParams={queryParams}
              onComplete={this.FrameCompleted}
              onCancel={this.FrameCompleted}
              Reload={() => this.setState({pageVersion: this.state.pageVersion + 1})}
              className="form-frame"
            />
          </div>
        </form>
      </React.Fragment>
    );
  }

  FormContent(legend, redirectPath, cancelPath) {
    return (
      <React.Fragment>
        { this.BackLink() }
        <Form
          legend={legend}
          redirectPath={redirectPath}
          cancelPath={cancelPath}
          OnSubmit={this.HandleSubmit}
        >
          { this.FullscreenButton() }
          <div>
            {this.AppFormSelection()}
            <div className="form-content">
              {this.TypeField()}
              {this.Image()}
              {this.BuildType(this.state.schema)}
              {this.PublicMetadataField()}
              {this.MetadataField()}
              {this.AccessChargeField()}
            </div>
          </div>
        </Form>
      </React.Fragment>
    );
  }

  PageContent() {
    if(!this.state.schema && !this.state.manageAppUrl) { return null; }

    const legend = this.state.createForm ? "Contribute content" : "Manage content";

    let redirectPath = Path.dirname(this.props.match.url);
    if(this.state.createForm && this.state.objectId) {
      redirectPath = UrlJoin(Path.dirname(this.props.match.url), this.state.objectId);
    }
    const cancelPath = Path.dirname(this.props.match.url);

    if(this.state.completed) {
      return <Redirect push to={redirectPath} />;
    }

    if(this.state.manageAppUrl && this.state.showManageApp) {
      return this.AppFrame(legend);
    } else {
      return this.FormContent(legend, redirectPath, cancelPath);
    }
  }

  render() {
    return (
      <AsyncComponent
        key={`object-form-page-${this.state.pageVersion}`}
        Load={
          async () => {
            let loadTasks = [];

            loadTasks.push(async () => await this.props.typeStore.ContentTypes());

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

            this.setState({
              createForm: !this.props.objectStore.objectId
            });

            this.Initialize();
          }
        }
        render={this.PageContent}
      />
    );
  }
}

export default ContentObjectForm;
