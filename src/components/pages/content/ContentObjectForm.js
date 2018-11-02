import React from "react";
import Path from "path";
import RequestPage from "../RequestPage";
import ContentObject from "../../../models/ContentObject";
import RequestForm from "../../forms/RequestForm";

class ContentObjectForm extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      libraryId: this.props.match.params.libraryId,
      objectId: this.props.match.params.objectId,
      name: "",
      type: "",
      metadata: "",
      createForm: this.props.location.pathname.endsWith("create"),
      contentObject: new ContentObject({})
    };

    this.FormContent = this.FormContent.bind(this);
    this.HandleInputChange = this.HandleInputChange.bind(this);
    this.HandleSubmit = this.HandleSubmit.bind(this);
    this.OnContentObjectLoaded = this.OnContentObjectLoaded.bind(this);
  }

  // Load existing content object on edit
  componentDidMount() {
    if(!this.state.createForm) {
      let requestId = this.props.GetContentObjectMetadata({
        libraryId: this.state.libraryId,
        objectId: this.state.objectId
      });

      this.setState({
        objectRequestId: requestId
      });
    }
  }

  // Set loaded content object
  OnContentObjectLoaded() {
    let contentObject = this.props.contentObjectMetadata[this.state.objectId];

    if(contentObject && contentObject.metadata) {
      this.setState({
        metadata: JSON.stringify(contentObject.metadata, null, 2),
        contentObject
      });
    }
  }

  HandleInputChange(event) {
    this.setState({
      [event.target.name]: event.target.value
    });
  }

  HandleSubmit({signer}) {
    const submitFunction = this.state.createForm ? this.props.CreateContentObject : this.props.UpdateContentObject;

    let requestId = submitFunction({
      libraryId: this.state.libraryId,
      objectId: this.state.objectId,
      name: this.state.name,
      type: this.state.type,
      metadata: this.state.metadata,
      signer
    });

    this.setState({ formSubmitRequestId: requestId });
  }

  ValidateJson(value, target) {
    try {
      const parsedValue = JSON.parse(value);
      target.style.border = "";
      target.style.outline = "";
      target.title = "";
      return parsedValue;
    } catch(error) {
      target.style.border = "1px solid red";
      target.style.outline = "none";
      target.title = error;
    }
  }

  // Automatically format and validate JSON
  JsonTextArea(name, value, onChange, UpdateValue) {
    return (
      <textarea
        name={name}
        value={value}
        onChange={onChange}
        onKeyUp={(event) => {
          this.ValidateJson(value, event.target);
        }}
        onBlur={(event) => {
          const parsedValue = this.ValidateJson(value, event.target);
          if(parsedValue) {
            UpdateValue(JSON.stringify(parsedValue, null, 2));
          }
        }}
      />
    );
  }

  CreateField({label, name, value}) {
    if(!this.state.createForm) { return null; }

    return (
      <div className="labelled-input">
        <label className="label" htmlFor={name}>{label}</label>
        <input name={name} value={value} onChange={this.HandleInputChange} />
      </div>
    );
  }

  FormContent() {
    return (
      <div className="form-content">
        { this.CreateField({label: "Name", name: "name", value: this.state.name}) }
        { this.CreateField({label: "Content Type", name: "type", value: this.state.type}) }
        <div className="labelled-input">
          <label className="textarea-label" htmlFor="metadata">Metadata</label>
          {this.JsonTextArea(
            "metadata",
            this.state.metadata,
            this.HandleInputChange,
            (formattedMetadata) => { this.setState({metadata: formattedMetadata});}
          )}
        </div>
      </div>
    );
  }

  PageContent() {
    const legend = this.state.createForm ? "Create content object" : "Update content object";

    return (
      <RequestForm
        requests={this.props.requests}
        requestId={this.state.formSubmitRequestId}
        legend={legend}
        formContent={this.FormContent()}
        redirectPath={Path.dirname(this.props.match.url)}
        cancelPath={Path.dirname(this.props.match.url)}
        OnSubmit={this.HandleSubmit}
      />
    );
  }

  render() {
    if(this.state.createForm) {
      return this.PageContent();
    } else {
      return (
        <RequestPage
          pageContent={this.PageContent()}
          requestId={this.state.objectRequestId}
          requests={this.props.requests}
          OnRequestComplete={this.OnContentObjectLoaded}
        />
      );
    }
  }
}

export default ContentObjectForm;
