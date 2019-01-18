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

const defaultSchema = [
  {
    "key": "eluv.name",
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
      metadata: ""
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

  RequestComplete() {
    let type = "";
    let types = {
      "": {
        name: "[none]",
        hash: ""
      }
    };

    if(this.state.createForm) {
      Object.values(this.props.types).forEach(type => {
        const typeName = (type.meta && type.meta["eluv.name"]) || type.hash;
        types[type.hash] = {
          ...type,
          name: typeName,
          schema: type.meta && type.meta["eluv.schema"],
          allowCustomMetadata: type.meta && type.meta["eluv.allowCustomMetadata"],
        };
      });
    } else {
      const object = this.props.objects[this.state.objectId];
      type = object.type;

      if(object.typeInfo) {
        const typeName = (object.typeInfo.meta && object.typeInfo.meta["eluv.name"]) || object.typeInfo.hash;

        types = {
          [type]: {
            ...object.typeInfo,
            name: typeName,
            schema: object.typeInfo.meta && object.typeInfo.meta["eluv.schema"],
            allowCustomMetadata: object.typeInfo.meta && object.typeInfo.meta["eluv.allowCustomMetadata"],
          }
        };
      }
    }

    this.setState({
      types,
      type: "",
      metadata: ""
    });

    this.SwitchType(types, type);
  }

  SwitchType(types, type) {
    const typeOptions = type && types[type] || {};

    if(typeOptions.manageAppUrl) {
      this.setState({
        manageAppUrl: typeOptions.manageAppUrl
      });

      return;
    }

    const schema = typeOptions.schema || defaultSchema;
    const allowCustomMetadata = typeOptions.schema ? typeOptions.allowCustomMetadata : true;
    const data = this.state.createForm ? undefined : this.props.objects[this.state.objectId].meta;

    const initialFields = InitializeSchema({schema, initialData: data});

    this.setState({
      fields: initialFields,
      schema: schema,
      allowCustomMetadata,
      manageAppUrl: undefined
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
              metadata: this.state.metadata
            });
          } else {
            // Update
            await this.props.UpdateFromContentTypeSchema({
              libraryId: this.state.libraryId,
              objectId: this.state.objectId,
              schema: this.state.schema,
              fields: this.state.fields,
              metadata: this.state.metadata
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
            <button
              className="action action-compact secondary action-full-width"
              type="button"
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
                        await DownloadFromUrl(url, label);
                      }
                    });
                  }
                }
              }
            >
              Download
            </button>
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
        return <BrowseWidget key={key} accept={entry.accept} label={label} onChange={onChange} multiple={entry.multiple} required={required} />;
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
              <button
                type="button"
                className="action action-compact action-full-width"
                onClick={() => this.HandleFieldChange({target: {value: ""}}, {key: Id.next()}, subtree.concat(entry.key))}
              >
                Add Element
              </button>
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
    if(!this.state.allowCustomMetadata) { return null; }

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

  FrameCompleted() {
    this.setState({completed: true});
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
          { this.TypeField() }
          <AppFrame
            appUrl={this.state.manageAppUrl}
            queryParams={queryParams}
            onComplete={this.FrameCompleted}
            onCancel={this.FrameCompleted}
            className="form-frame"
          />
          <div className="actions-container">
            <button className="action secondary" onClick={this.FrameCompleted}>Cancel</button>
          </div>
        </fieldset>
      </form>
    );
  }

  FormContent(legend, redirectPath, cancelPath) {
    const formContent = (
      <div>
        {this.TypeField()}
        {this.BuildType(this.state.schema)}
        {this.MetadataField()}
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

    if(this.state.manageAppUrl) {
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
