import React from "react";
import RequestForm from "../../forms/RequestForm";
import { JsonTextArea } from "../../../utils/Input";
import RequestPage from "../RequestPage";
import Path from "path";

class ContentLibraryForm extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      name: "",
      description: "",
      publicMetadata: "",
      privateMetadata: "",
      libraryId: this.props.match.params.libraryId,
      createForm: this.props.location.pathname.endsWith("create")
    };

    this.FormContent = this.FormContent.bind(this);
    this.HandleInputChange = this.HandleInputChange.bind(this);
    this.HandleSubmit = this.HandleSubmit.bind(this);
    this.OnContentLibraryLoaded = this.OnContentLibraryLoaded.bind(this);
  }

  // Load existing content library on edit
  componentDidMount() {
    if(!this.state.createForm) {
      let requestId = this.props.GetContentLibrary({
        libraryId: this.state.libraryId
      });

      this.setState({
        libraryRequestId: requestId
      });
    }
  }

  // Set loaded content object
  OnContentLibraryLoaded() {
    const contentLibrary = this.props.contentLibraries[this.state.libraryId];

    if(contentLibrary) {
      this.setState({
        name: contentLibrary.name,
        description: contentLibrary.description,
        contractAddress: contentLibrary.contractAddress,
        publicMetadata: JSON.stringify(contentLibrary.metadata, null, 2)
      })
    }
  }

  HandleInputChange(event) {
    this.setState({
      [event.target.name]: event.target.value
    });
  }

  HandleSubmit() {
    let requestId;

    if(this.state.createForm) {
      requestId = this.props.CreateContentLibrary({
        name: this.state.name,
        description: this.state.description,
        publicMetadata: this.state.publicMetadata,
        privateMetadata: this.state.privateMetadata
      });
    } else {
      requestId = this.props.UpdateContentLibrary({
        libraryId: this.state.libraryId,
        name: this.state.name,
        description: this.state.description,
        contractAddress: this.state.contractAddress,
        publicMetadata: this.state.publicMetadata
      })
    }

    this.setState({ formSubmitRequestId: requestId });
  }

  PrivateMetadata() {
    // Don't allow editing of private metadata on existing libraries
    // Should be done in the object
    if(!this.state.createForm) { return null; }

    return (
      <div className="labelled-input">
        <label className="textarea-label" htmlFor="privateMetadata">Private Metadata</label>
        <JsonTextArea
          name="privateMetadata"
          value={this.state.privateMetadata}
          onChange={this.HandleInputChange}
          UpdateValue={formattedMetadata => this.setState({privateMetadata: formattedMetadata})}
        />
      </div>
    );
  }

  FormContent() {
    return (
      <div className="form-content">
        <div className="labelled-input">
          <label htmlFor="name">Name</label>
          <input name="name" value={this.state.name} onChange={this.HandleInputChange} />
        </div>
        <div className="labelled-input">
          <label className="textarea-label" htmlFor="description">Description</label>
          <textarea name="description" value={this.state.description} onChange={this.HandleInputChange} />
        </div>
        <div className="labelled-input">
          <label className="textarea-label" htmlFor="publicMetadata">Public Metadata</label>
          <JsonTextArea
            name="publicMetadata"
            value={this.state.publicMetadata}
            onChange={this.HandleInputChange}
            UpdateValue={formattedMetadata => this.setState({publicMetadata: formattedMetadata})}
          />
        </div>
        { this.PrivateMetadata() }
      </div>
    );
  }

  PageContent() {
    const legend = this.state.createForm ? "Create a new content library" : "Edit content library";

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
          requestId={this.state.libraryRequestId}
          requests={this.props.requests}
          OnRequestComplete={this.OnContentLibraryLoaded}
        />
      );
    }
  }
}

export default ContentLibraryForm;
