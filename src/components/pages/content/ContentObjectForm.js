import React from "react";
import PropTypes from "prop-types";
import {Action, BrowseWidget, Form, IconButton, RadioSelect, Tabs} from "elv-components-js";
import {JsonTextArea} from "../../../utils/Input";
import UrlJoin from "url-join";
import Path from "path";
import {InitializeSchema, GetValue, SetValue, RemoveValue} from "../../../utils/TypeSchema";
import Id from "../../../utils/Id";
import TrashIcon from "../../../static/icons/trash.svg";
import {DownloadFromUrl} from "../../../utils/Files";
import Fabric from "../../../clients/Fabric";
import AppFrame from "../../components/AppFrame";
import Redirect from "react-router/es/Redirect";

const defaultSchema = [
  {
    "key": "name",
    "label": "Name",
    "type": "string",
    "required": true
  },
  {
    "key": "eluv.description",
    "label": "Description",
    "type": "text",
    "required": false
  }
];

// Build a form from a JSON schema
class ContentObjectForm extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      completed: false,
      metadata: "",
      uploadStatus: {}
    };

    this.HandleInputChange = this.HandleInputChange.bind(this);
    this.HandleFieldChange = this.HandleFieldChange.bind(this);
    this.HandleSubmit = this.HandleSubmit.bind(this);
    this.HandleTypeChange = this.HandleTypeChange.bind(this);
    this.RemoveElement = this.RemoveElement.bind(this);
    this.FrameCompleted = this.FrameCompleted.bind(this);
    this.UploadStatusCallback = this.UploadStatusCallback.bind(this);
  }

  componentDidMount() {
    this.Initialize();
  }

  FormatType(type) {
    // Skip "none" type
    if(!type.hash) { return type; }

    const typeName = (type.meta && (type.meta.name)) || type.hash;

    return {
      ...type,
      name: typeName,
      schema: type.meta && type.meta["eluv.schema"],
      allowCustomMetadata: type.meta && type.meta["eluv.allowCustomMetadata"],
    };
  }

  Initialize() {
    let type = "";
    let types = {
      "": {
        name: "[none]",
        hash: ""
      }
    };

    let metadata = "";
    let accessCharge = 0;
    if(this.props.createForm) {
      let allowedTypes = this.props.library.types;
      if(Object.keys(allowedTypes).length > 0) {
        // Allowed types specified on library - limit options to that list
        type = Object.values(allowedTypes)[0].hash;
        types = allowedTypes;
      } else {
        // No allowed types specified on library - all types allowed
        types = {
          ...types,
          ...this.props.types
        };
      }

      Object.values(types).forEach(type => types[type.hash] = this.FormatType(type));
    } else {
      const object = this.props.object;
      metadata = JSON.stringify(object.meta, null, 2);
      accessCharge = object.accessInfo.accessCharge;
      type = object.type;

      if(object.typeInfo) {
        types = {
          [type]: this.FormatType(object.typeInfo)
        };
      }
    }

    this.setState({
      types,
      type,
      metadata,
      accessCharge
    });

    this.SwitchType(types, type);
  }

  SwitchType(types, type) {
    const object = this.props.object;
    let typeOptions = type && types[type] || {};

    let manageAppUrl;
    let showManageApp = false;
    let schema = typeOptions.schema || defaultSchema;
    if(object && object.manageAppUrl && !object.isContentType) {
      manageAppUrl = object.manageAppUrl;
      showManageApp = true;
    } else if(typeOptions.manageAppUrl) {
      manageAppUrl = typeOptions.manageAppUrl;
      showManageApp = true;
    }

    const allowCustomMetadata = typeOptions.schema ? typeOptions.allowCustomMetadata : true;
    const data = this.props.createForm ? undefined : this.props.object.meta;

    const initialFields = InitializeSchema({schema, initialData: data});

    this.setState({
      type,
      fields: initialFields,
      schema: schema,
      allowCustomMetadata,
      manageAppUrl,
      showManageApp
    });
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
    this.setState({
      uploadStatus: {
        ...this.state.uploadStatus,
        [key]: {
          ...(this.state.uploadStatus || {})[key],
          [filename]: (uploaded * 100 / total).toFixed(1)
        }
      }
    });
  }

  async HandleSubmit() {
    const type = this.state.type === "[none]" ? "" : this.state.type;

    await this.props.methods.Submit({
      type,
      libraryId: this.props.libraryId,
      objectId: this.props.objectId,
      schema: this.state.schema,
      fields: this.state.fields,
      metadata: this.state.metadata,
      accessCharge: this.state.accessCharge,
      callback: this.UploadStatusCallback
    });
  }

  TypeField() {
    if(!this.props.createForm) { return; }

    const options = Object.values(this.state.types).map(({name, hash}) => {
      return <option key={"type-" + hash} name="type" value={hash}>{ name }</option>;
    });

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
                  await this.props.DownloadPart({
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
        field = <JsonTextArea
          key={key}
          UpdateValue={formattedMetadata => this.HandleFieldChange({target: {value: formattedMetadata}}, entry, subtree) }
          onChange={onChange}
          name={entry.key}
          value={value}
        />;
        break;
      case "file":
        const required = entry.required && this.props.createForm;

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
    //if(!this.state.allowCustomMetadata) { return null; }
    return [
      <label key="metadata-input-label" className="align-top">Metadata</label>,
      <JsonTextArea
        key="metadata-input"
        UpdateValue={formattedMetadata => this.setState({metadata: formattedMetadata}) }
        onChange={this.HandleInputChange}
        name="metadata"
        value={this.state.metadata}
      />
    ];
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
    if(!this.state.manageAppUrl) { return null; }

    return (
      <Tabs
        className="compact"
        selected={this.state.showManageApp}
        onChange={(value) => this.setState({showManageApp: value})}
        options={[["App", true], ["Form", false]]}
      />
    );
  }

  AppFrame(legend) {
    const queryParams = {
      contentSpaceId: Fabric.contentSpaceId,
      libraryId: this.props.libraryId,
      objectId: this.props.objectId,
      type: this.state.type,
      action: "manage"
    };

    return (
      <form>
        <fieldset>
          <legend>{legend}</legend>
          { this.AppFormSelection() }
          { this.TypeField() }
          <br />
          <AppFrame
            appUrl={this.state.manageAppUrl}
            queryParams={queryParams}
            onComplete={this.FrameCompleted}
            onCancel={this.FrameCompleted}
            className="form-frame"
          />
          <div className="form-actions">
            <Action className="secondary" onClick={this.FrameCompleted}>Cancel</Action>
          </div>
        </fieldset>
      </form>
    );
  }

  FormContent(legend, redirectPath, cancelPath) {
    const formContent = (
      <div>
        {this.AppFormSelection()}
        <div className="form-content">
          {this.TypeField()}
          {this.BuildType(this.state.schema)}
          {this.MetadataField()}
          {this.AccessChargeField()}
        </div>
      </div>
    );

    return (
      <div>
        <div className="actions-container manage-actions">
          <Action type="link" to={Path.dirname(this.props.match.url)} className="secondary">Back</Action>
        </div>
        <Form
          formContent={formContent}
          legend={legend}
          redirectPath={redirectPath}
          cancelPath={cancelPath}
          status={this.props.methodStatus.Submit}
          OnSubmit={this.HandleSubmit}
        />
      </div>
    );
  }

  render() {
    if(!this.state.schema && !this.state.manageAppUrl) { return null; }

    const legend = this.props.createForm ? "Contribute content" : "Manage content";

    let redirectPath = Path.dirname(this.props.match.url);
    if(this.props.createForm) {
      // On creation, objectId won't exist until submission
      redirectPath = this.props.objectId ?
        UrlJoin(Path.dirname(this.props.match.url), this.props.objectId) : Path.dirname(this.props.match.url);
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
}

ContentObjectForm.propTypes = {
  libraryId: PropTypes.string.isRequired,
  library: PropTypes.object.isRequired,
  objectId: PropTypes.string,
  object: PropTypes.object,
  types: PropTypes.object.isRequired,
  createForm: PropTypes.bool.isRequired,
  methods: PropTypes.shape({
    Submit: PropTypes.func.isRequired
  })
};

export default ContentObjectForm;
