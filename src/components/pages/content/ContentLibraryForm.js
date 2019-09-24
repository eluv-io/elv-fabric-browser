import React from "react";
import PropTypes from "prop-types";
import UrlJoin from "url-join";
import Path from "path";
import {Action, BrowseWidget, Form, JsonInput, LoadingElement} from "elv-components-js";

class ContentLibraryForm extends React.Component {
  constructor(props) {
    super(props);

    const library = props.library || {};

    this.state = {
      name: library.name || "",
      description: library.description || "",
      publicMetadata: JSON.stringify(library.publicMeta, null, 2) || "",
      privateMetadata: JSON.stringify(library.privateMeta, null, 2) || "",
      kmsId: library.kmsId || "",
      isContentSpaceLibrary: library.isContentSpaceLibrary || false,
      imageSelection: ""
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
    const libraryId = await this.props.methods.Submit({
      libraryId: this.props.libraryId,
      name: this.state.name,
      description: this.state.description,
      publicMetadata: this.state.publicMetadata,
      privateMetadata: this.state.privateMetadata,
      image: this.state.imageSelection,
      kmsId: this.state.kmsId
    });

    this.setState({libraryId});
  }

  Image() {
    // Content Space library can't have an image
    if(this.state.isContentSpaceLibrary) { return null; }

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

  PageContent() {
    const legend = this.props.createForm ? "Create content library" : "Manage content library";
    const status = {...this.props.methodStatus.Submit};
    status.completed = status.completed && !!(this.state.libraryId);

    const backPath = Path.dirname(this.props.match.url);
    const redirectPath = this.props.createForm ? UrlJoin(backPath, this.state.libraryId || "") : backPath;

    return (
      <div>
        <div className="actions-container manage-actions">
          <Action type="link" to={Path.dirname(this.props.match.url)} className="secondary">Back</Action>
        </div>
        <Form
          legend={legend}
          redirectPath={redirectPath}
          cancelPath={Path.dirname(this.props.match.url)}
          status={status}
          OnSubmit={this.HandleSubmit}
        >
          <div className="form-content">
            <label htmlFor="name">Name</label>
            <input name="name" value={this.state.name} required={true} onChange={this.HandleInputChange} disabled={this.state.isContentSpaceLibrary} />

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

            <label htmlFor="kmsId">
              KMS ID
              <span className="help-text" hidden={!this.props.createForm}>(optional)</span>
            </label>
            <input name="kmsId" value={this.state.kmsId} required={false} onChange={this.HandleInputChange} disabled={!this.props.createForm}/>
          </div>
        </Form>
      </div>
    );
  }

  render() {
    return <LoadingElement fullPage={true} loading={this.props.loading} render={this.PageContent} />;
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
