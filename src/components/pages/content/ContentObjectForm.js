import React from "react";
import RequestForm from "../../forms/RequestForm";
import BrowseWidget from "../../components/BrowseWidget";
import {JsonTextArea} from "../../../utils/Input";
import RequestPage from "../RequestPage";
import Path from "path";
import {InitializeSchema, GetValue, SetValue, RemoveValue} from "../../../utils/TypeSchema";
import RadioSelect from "../../components/RadioSelect";
import Id from "../../../utils/Id";
import TrashIcon from "../../../static/icons/trash.svg";
import {DownloadFromUrl} from "../../../utils/Files";
import Fabric from "../../../clients/Fabric";
import {IconButton} from "../../components/Icons";
import AppFrame from "../../components/AppFrame";
import Redirect from "react-router/es/Redirect";
import Action from "../../components/Action";
import PageTabs from "../../components/PageTabs";

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

    const objectId = this.props.match.params.objectId;
    this.state = {
      libraryId: this.props.libraryId || this.props.match.params.libraryId,
      objectId,
      createForm: !objectId,
      metadata: "",
      previewUrls: {}
    };

    this.RequestComplete = this.RequestComplete.bind(this);
    this.PageContent = this.PageContent.bind(this);
    this.HandleInputChange = this.HandleInputChange.bind(this);
    this.HandleFieldChange = this.HandleFieldChange.bind(this);
    this.HandleSubmit = this.HandleSubmit.bind(this);
    this.HandleTypeChange = this.HandleTypeChange.bind(this);
    this.RemoveElement = this.RemoveElement.bind(this);
    this.FrameCompleted = this.FrameCompleted.bind(this);
  }

  // Load existing content object on edit
  componentDidMount() {
    if(this.state.createForm) {
      this.setState({
        loadRequestId: this.props.WrapRequest({
          todo: async () => {
            await this.props.ListContentTypes({});
            await this.props.ListLibraryContentTypes({libraryId: this.state.libraryId});
          }
        })
      });
    } else {
      this.setState({
        loadRequestId: this.props.WrapRequest({
          todo: async () => {
            await this.props.GetContentObject({
              libraryId: this.state.libraryId,
              objectId: this.state.objectId,
            });
          }
        })
      });
    }
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

  RequestComplete() {
    let type = "";
    let types = {
      "": {
        name: "[none]",
        hash: ""
      }
    };

    let metadata = "";
    let accessCharge = 0;
    if(this.state.createForm) {
      let allowedTypes = this.props.libraries[this.state.libraryId].types;
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
      const object = this.props.objects[this.state.objectId];
      metadata = JSON.stringify(object.meta, null, 2);
      accessCharge = object.baseAccessCharge;
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
    const object = this.props.objects[this.state.objectId];
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
    const data = this.state.createForm ? undefined : this.props.objects[this.state.objectId].meta;

    const initialFields = InitializeSchema({schema, initialData: data});

    this.setState({
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
    // Update type, then initialize the schema for that type
    const type = event.target.value;

    this.setState({
      type,
    }, () => this.SwitchType(this.state.types, type));
  }

  HandleFieldChange(event, entry, subtree=[]) {
    let value = event.target.value;
    if(entry.type === "file") {
      value = event.target.files;

      if(entry.preview) {
        new Response(event.target.files[0]).blob()
          .then(imageData => {
            this.setState({
              fields: SetValue({
                data: this.state.fields,
                subtree,
                attr: entry.key,
                value
              }),
              previewUrls: {
                ...this.state.previewUrls,
                [entry.key]: window.URL.createObjectURL(imageData)
              }
            });
          });
        return;
      }
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

  HandleSubmit() {
    const type = this.state.type === "[none]" ? "" : this.state.type;

    this.setState({
      requestId: this.props.WrapRequest({
        todo: async () => {
          if(this.state.createForm) {
            // Create
            await this.props.CreateFromContentTypeSchema({
              libraryId: this.state.libraryId,
              type,
              schema: this.state.schema,
              fields: this.state.fields,
              metadata: this.state.metadata,
              accessCharge: this.state.accessCharge
            });
          } else {
            // Update
            await this.props.UpdateFromContentTypeSchema({
              libraryId: this.state.libraryId,
              objectId: this.state.objectId,
              schema: this.state.schema,
              fields: this.state.fields,
              metadata: this.state.metadata,
              accessCharge: this.state.accessCharge
            });
          }
        }
      })
    });
  }

  TypeField() {
    if(!this.state.createForm) { return; }

    const options = Object.values(this.state.types).map(({name, hash}) => {
      return <option key={"type-" + hash} name="type" value={hash}>{ name }</option>;
    });

    return (
      <div className="labelled-input">
        <label className="label" htmlFor="type">Content Type</label>
        <select name="type" value={this.state.type} onChange={this.HandleTypeChange}>
          { options }
        </select>
      </div>
    );
  }

  BuildField(entry, subtree=[]) {
    const onChange = (event) => this.HandleFieldChange(event, entry, subtree);

    const key = `field-${subtree.join("-")}-${entry.key}`;
    const value = GetValue({data: this.state.fields, subtree, attr: entry.key});

    // Compare with undefined to allow blank labels
    const label = entry.label !== undefined ? entry.label : entry.key;

    let field;
    switch(entry.type) {
      case "label":
        field = <div className="form-text">{entry.text}</div>;
        break;
      case "attachedFile":
        field = (
          <div className="actions-container compact full-width">
            <Action
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
          </div>
        );
        break;
      case "string":
        field = <input name={entry.key} required={entry.required} value={value} onChange={onChange} />;
        break;
      case "text":
        field = <textarea name={entry.key} required={entry.required} value={value} onChange={onChange} />;
        break;
      case "integer":
        field = <input name={entry.key} required={entry.required} value={value} type="number" step={1} onChange={onChange} />;
        break;
      case "number":
        field = <input name={entry.key} required={entry.required} value={value} type="number" step={0.000000000001} onChange={onChange} />;
        break;
      case "boolean":
        field = (
          <div className="checkbox-container">
            <input name={entry.key} required={entry.required} checked={value} type="checkbox" onChange={onChange} />
          </div>
        );
        break;
      case "choice":
        return <RadioSelect
          key={key}
          name={entry.key}
          label={label}
          required={entry.required}
          selected={value}
          options={entry.options}
          onChange={onChange}
        />;
      case "json":
        field = <JsonTextArea
          UpdateValue={formattedMetadata => this.HandleFieldChange({target: {value: formattedMetadata}}, entry, subtree) }
          onChange={onChange}
          name={entry.key}
          value={value}
        />;
        break;
      case "file":
        const required = entry.required && this.state.createForm;
        const browseWidget = <BrowseWidget key={key} accept={entry.accept} label={label} onChange={onChange} multiple={entry.multiple} required={required} />;
        const previewUrl = this.state.previewUrls[entry.key];
        let preview;
        if(previewUrl) {
          preview = (
            <div className="labelled-input">
              <label />
              <div className="image-preview">
                <img src={previewUrl} alt={`${label} Preview`} title={`${label} Preview`} />
              </div>
            </div>
          );
        }

        return (
          <div key={"image-preview-" + key}>
            { preview }
            { browseWidget }
          </div>
        );
      case "list":
        const elements = Object.keys(value).map(index => {
          const element = {
            key: index,
            type: "list-element"
          };
          return this.BuildField(element, subtree.concat(entry.key));
        });
        field = (
          <div className="full-width">
            <div className="actions-container compact left">
              <Action
                className="action-compact action-full-width"
                onClick={() => this.HandleFieldChange({target: {value: ""}}, {key: Id.next()}, subtree.concat(entry.key))}
              >
                Add Element
              </Action>
            </div>
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
              src={TrashIcon}
              title="Remove Element"
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
            <div className="subsection">
              {fields}
            </div>
          );
        }
    }

    return (
      <div className="labelled-input" key={key}>
        <label className={["label", "list", "text", "json", "object"].includes(entry.type) ? "textarea-label" : "label"} htmlFor={name}>{label}</label>
        { field }
      </div>
    );
  }

  BuildType(schema, subtree=[]) {
    return schema.map(entry => this.BuildField(entry, subtree));
  }

  MetadataField() {
    //if(!this.state.allowCustomMetadata) { return null; }
    return (
      <div className="labelled-input">
        <label className="textarea-label">Metadata</label>
        <JsonTextArea
          UpdateValue={formattedMetadata => this.setState({metadata: formattedMetadata}) }
          onChange={this.HandleInputChange}
          name="metadata"
          value={this.state.metadata}
        />
      </div>
    );
  }

  AccessChargeField() {
    return (
      <div className="labelled-input">
        <label htmlFor="accessCharge">Access Charge</label>
        <input type="number" name="accessCharge" value={this.state.accessCharge} onChange={this.HandleInputChange} />
      </div>
    );
  }

  FrameCompleted() {
    this.setState({completed: true});
  }

  AppFormSelection() {
    if(!this.state.manageAppUrl) { return null; }

    return (
      <div className="labelled-input">
        <label>Form</label>
        <PageTabs
          className="compact"
          selected={this.state.showManageApp}
          onChange={(value) => this.setState({showManageApp: value})}
          options={[["App", true], ["Default", false]]}
        />
      </div>
    );
  }

  AppFrame(legend) {
    const queryParams = {
      contentSpaceId: Fabric.contentSpaceId,
      libraryId: this.state.libraryId,
      objectId: this.state.objectId,
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
          <div className="actions-container">
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
        {this.TypeField()}
        {this.BuildType(this.state.schema)}
        {this.MetadataField()}
        {this.AccessChargeField()}
      </div>
    );

    return <RequestForm
      formContent={formContent}
      legend={legend}
      requests={this.props.requests}
      requestId={this.state.requestId}
      redirectPath={redirectPath}
      cancelPath={cancelPath}
      OnSubmit={this.HandleSubmit}
    />;
  }

  PageContent() {
    if(!this.state.schema && !this.state.manageAppUrl) { return null; }

    const legend = this.state.createForm ? "Contribute content" : "Manage content";

    let redirectPath = Path.dirname(this.props.match.url);
    if(this.state.createForm) {
      // On creation, objectId won't exist until submission
      redirectPath = this.state.objectId ?
        Path.join(Path.dirname(this.props.match.url), this.state.objectId) : Path.dirname(this.props.match.url);
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
      <RequestPage
        requestId={this.state.loadRequestId}
        requests={this.props.requests}
        pageContent={this.PageContent}
        OnRequestComplete={this.RequestComplete}
      />
    );
  }
}

export default ContentObjectForm;
