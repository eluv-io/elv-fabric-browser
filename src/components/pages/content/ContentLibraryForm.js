import React from "react";
import PropTypes from "prop-types";
import { JsonTextArea } from "../../../utils/Input";
import Path from "path";
import BrowseWidget from "../../components/BrowseWidget";
import RequestElement from "../../components/RequestElement";
import Form from "../../forms/Form";

class ContentLibraryForm extends React.Component {
  constructor(props) {
    super(props);

    const library = props.library || {};

    this.state = {
      name: library.name || "",
      description: library.description || "",
      publicMetadata: JSON.stringify(library.meta, null, 2) || "",
      privateMetadata: JSON.stringify(library.privateMeta, null, 2) || "",
      isContentSpaceLibrary: library.isContentSpaceLibrary || false,
      imageSelection: "",
      redirectPath: Path.dirname(this.props.match.url)
    };

    this.PageContent = this.PageContent.bind(this);
    this.FormContent = this.FormContent.bind(this);
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
    const libraryId = await this.props.methods.Submit({
      libraryId: this.props.libraryId,
      name: this.state.name,
      description: this.state.description,
      publicMetadata: this.state.publicMetadata,
      privateMetadata: this.state.privateMetadata,
      image: this.state.imageSelection
    });

    if(this.props.createForm) {
      // Ensure redirect path is updated before completion
      await new Promise(resolve =>
        this.setState({
          redirectPath: Path.join(this.state.redirectPath, libraryId)
        }, resolve)
      );
    }
  }

  Image() {
    // Content Space library can't have an image
    if(this.state.isContentSpaceLibrary) { return null; }

    return (
      <div>
        <BrowseWidget
          label="Image"
          required={false}
          multiple={false}
          accept="image/*"
          preview={true}
          onChange={this.HandleImageChange}
        />
      </div>
    );
  }

  FormContent() {
    return (
      <div className="form-content">
        <div className="labelled-input">
          <label htmlFor="name">Name</label>
          <input name="name" value={this.state.name} required={true} onChange={this.HandleInputChange} readOnly={this.state.isContentSpaceLibrary} />
        </div>
        { this.Image() }
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
        <div className="labelled-input">
          <label className="textarea-label" htmlFor="privateMetadata">Private Metadata</label>
          <JsonTextArea
            name="privateMetadata"
            value={this.state.privateMetadata}
            onChange={this.HandleInputChange}
            UpdateValue={formattedMetadata => this.setState({privateMetadata: formattedMetadata})}
          />
        </div>
      </div>
    );
  }

  PageContent() {
    const legend = this.props.createForm ? "Create content library" : "Manage content library";

    return (
      <Form
        legend={legend}
        formContent={this.FormContent()}
        redirectPath={this.state.redirectPath}
        cancelPath={Path.dirname(this.props.match.url)}
        status={this.props.methodStatus.Submit}
        OnSubmit={this.HandleSubmit}
      />
    );
  }

  render() {
    return <RequestElement fullPage={true} loading={this.props.loading} render={this.PageContent} />;
  }
}

ContentLibraryForm.propTypes = {
  libraryId: PropTypes.string,
  library: PropTypes.object,
  createForm: PropTypes.bool.isRequired,
  methods: PropTypes.shape({
    Submit: PropTypes.func.isRequired
  })
};

export default ContentLibraryForm;
