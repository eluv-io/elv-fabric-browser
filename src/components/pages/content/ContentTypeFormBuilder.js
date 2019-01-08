import React from "react";
import RequestForm from "../../forms/RequestForm";
import BrowseWidget from "../../components/BrowseWidget";
import {JsonTextArea} from "../../../utils/Input";
import RequestPage from "../RequestPage";
import Path from "path";
import {GetFieldInfo, InitializeSchema, SetValue} from "../../../utils/TypeSchema";

const defaultSchema = {
  "options": {
    "allowCustomMetadata": true,
  },
  "main": [
    "eluv.name",
    "eluv.description"
  ],
  "fields": {
    "eluv.name": {
      "label": "Name",
      "type": "string",
      "required": true
    },
    "eluv.description": {
      "label": "Description",
      "type": "text",
      "required": false
    }
  }
};

// Build a form from a JSON schema
class ContentTypeFormBuilder extends React.Component {
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
  }

  // Load existing content object on edit
  componentDidMount() {
    if(this.state.createForm) {
      this.setState({
        loadRequestId: this.props.WrapRequest({
          todo: async () => {
            await this.props.ListContentTypes();
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

            await this.props.ListContentTypes();
          }
        })
      });
    }
  }

  RequestComplete() {
    const object = this.state.createForm ? undefined : this.props.objects[this.state.objectId];

    let types = {
      "": {
        name: "[none]",
        hash: ""
      }
    };

    Object.values(this.props.types).forEach(type => {
      const typeName = (type.meta && type.meta["eluv.name"]) || type.hash;
      types[type.hash] = {
        name: typeName,
        hash: type.hash,
        schema: type.meta && type.meta["eluv.schema"]
      };
    });

    const type = object ? object.type : "";

    this.setState({
      types,
      type,
      metadata: object ? JSON.stringify(object.meta, null, 2) : ""
    });

    this.SwitchSchema(types, type);
  }

  SwitchSchema(types, type) {
    const schema = type && types[type].schema || defaultSchema;
    const data = this.state.createForm ? undefined : this.props.objects[this.state.objectId].meta;

    const initialFields = InitializeSchema({schema, initialData: data});

    this.setState({
      fields: initialFields,
      schema: schema
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
    }, () => this.SwitchSchema(this.state.types, type));
  }

  HandleFieldChange(name, type, event, subtree=[]) {
    const value = type === "file" ? event.target.files : event.target.value;

    this.setState({
      fields: SetValue({
        data: this.state.fields,
        subtree,
        attr: name,
        value
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

  BuildField(name, subtree=[], options={}) {
    const fieldInfo = GetFieldInfo({
      schema: this.state.schema,
      data: this.state.fields,
      subtree,
      attr: name
    });

    const value = fieldInfo.value;
    const type = fieldInfo.type;
    const label = options.label || fieldInfo.label || name;
    const key = options.key || `input-${subtree.join("-")}${name}`;

    const fieldOptions = {name, required: fieldInfo.required};

    const onChange = (event) => this.HandleFieldChange(name, type, event, subtree);

    let field;
    switch(type) {
      case "json":
        field = <JsonTextArea
          UpdateValue={formattedMetadata => this.HandleFieldChange(name, type, {target: {value: formattedMetadata}}, subtree) }
          onChange={onChange}
          name={name}
          value={value}
        />;
        break;
      case "string":
        field = <input {...fieldOptions} value={value} onChange={onChange} />;
        break;
      case "text":
        field = <textarea {...fieldOptions} value={value} onChange={onChange} />;
        break;
      case "integer":
        field = <input {...fieldOptions} value={value} type="number" step={1} onChange={onChange} />;
        break;
      case "number":
        field = <input {...fieldOptions} value={value} type="number" step={0.000000001} onChange={onChange} />;
        break;
      case "file":
        const required = fieldInfo.required && this.state.createForm;
        return <BrowseWidget key={key} label={label} onChange={onChange} multiple={fieldInfo.multiple} required={required} />;
      case "list":
        break;
      case "choice":
        break;
      case "object":
        field = (
          <div className="subsection">
            { this.BuildType(fieldInfo.fields, subtree.concat([name])) }
          </div>
        );
        break;
      default:
        return this.BuildField(type, subtree, {key, label});
    }

    return (
      <div className="labelled-input" key={key}>
        <label className={["text", "json", "object"].includes(type) ? "textarea-label" : "label"} htmlFor={name}>{label}</label>
        { field }
      </div>
    );
  }

  BuildType(fields, subtree=[]) {
    return fields.map(fieldName => this.BuildField(fieldName, subtree));
  }

  MetadataField() {
    if(!(this.state.schema.options && this.state.schema.options.allowCustomMetadata)) { return null; }
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

  PageContent() {
    if(!this.state.schema) { return null; }

    const legend = this.state.createForm ? "Contribute content" : "Manage content";

    let redirectPath = Path.dirname(this.props.match.url);
    if(this.state.createForm) {
      // On creation, objectId won't exist until submission
      redirectPath = this.state.objectId ?
        Path.join(Path.dirname(this.props.match.url), this.state.objectId) : Path.dirname(this.props.match.url);
    }
    const cancelPath = Path.dirname(this.props.match.url);

    const formContent = (
      <div>
        { this.TypeField() }
        { this.BuildType(this.state.schema.main) }
        { this.MetadataField() }
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

export default ContentTypeFormBuilder;
