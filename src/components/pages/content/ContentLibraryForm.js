import React from "react";
import RequestForm from "../../forms/RequestForm";
import { JsonTextArea } from "../../../utils/Input";
import RequestPage from "../RequestPage";
import Path from "path";
import BrowseWidget from "../../components/BrowseWidget";

class ContentLibraryForm extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      name: "",
      description: "",
      publicMetadata: "",
      privateMetadata: "",
      imagePreviewUrl: "",
      imageSelection: "",
      libraryId: this.props.libraryId || this.props.match.params.libraryId,
      createForm: this.props.location.pathname.endsWith("create")
    };

    this.FormContent = this.FormContent.bind(this);
    this.HandleInputChange = this.HandleInputChange.bind(this);
    this.HandleImageChange = this.HandleImageChange.bind(this);
    this.HandleSubmit = this.HandleSubmit.bind(this);
    this.OnContentLibraryLoaded = this.OnContentLibraryLoaded.bind(this);
  }

  // Load existing content library on edit
  componentDidMount() {
    if(!this.state.createForm) {
      this.setState({
        loadRequestId: this.props.WrapRequest({
          todo: async () => {
            await this.props.ListContentObjects({
              libraryId: this.state.libraryId
            });
          }
        })
      });
    }
  }

  // Set loaded content object
  OnContentLibraryLoaded() {
    const contentLibrary = this.props.contentLibraries[this.state.libraryId];
    if(contentLibrary) {
      this.setState({
        isContentSpaceLibrary: contentLibrary.isContentSpaceLibrary,
        libraryObjectId: contentLibrary.libraryObject.objectId,
        name: contentLibrary.name,
        description: contentLibrary.description,
        contractAddress: contentLibrary.contractAddress,
        publicMetadata: JSON.stringify(contentLibrary.metadata, null, 2),
        privateMetadata: JSON.stringify(contentLibrary.privateMetadata, null, 2),
        imagePreviewUrl: contentLibrary.ImageUrl()
      })
    }
  }

  HandleInputChange(event) {
    this.setState({
      [event.target.name]: event.target.value
    });
  }

  HandleImageChange(event) {
    // Create preview image and set image selection state
    if (event.target.files) {
      const file = event.target.files[0];
      new Response(file).blob()
        .then(imageData => {
          this.setState({
            imagePreviewUrl: window.URL.createObjectURL(imageData),
            imageSelection: file
          });
        });
    }
  }

  HandleSubmit() {
    if(this.state.createForm) {
      this.setState({
        submitRequestId: this.props.WrapRequest({
          todo: async () => {
            await this.props.CreateContentLibrary({
              owner: this.props.currentAccountAddress,
              name: this.state.name,
              description: this.state.description,
              publicMetadata: this.state.publicMetadata,
              privateMetadata: this.state.privateMetadata,
              image: this.state.imageSelection
            });
          }
        })
      });
    } else {
      this.setState({
        submitRequestId: this.props.WrapRequest({
          todo: async () => {
            await this.props.UpdateContentLibrary({
              libraryId: this.state.libraryId,
              libraryObjectId: this.state.libraryObjectId,
              name: this.state.name,
              description: this.state.description,
              contractAddress: this.state.contractAddress,
              publicMetadata: this.state.publicMetadata,
              privateMetadata: this.state.privateMetadata,
              image: this.state.imageSelection
            })
          }
        })
      });
    }
  }

  ImagePreview() {
    if(!this.state.imagePreviewUrl) { return null; }

    return (
      <div className="image-preview">
        <img src={this.state.imagePreviewUrl} />
      </div>
    );
  }

  FormContent() {
    return (
      <div className="form-content">
        { this.ImagePreview() }
        <BrowseWidget
          label="Image"
          required={false}
          multiple={false}
          accept="image/*"
          onChange={this.HandleImageChange}
        />
        <div className="labelled-input">
          <label htmlFor="name">Name</label>
          <input name="name" value={this.state.name} onChange={this.HandleInputChange} readOnly={this.state.isContentSpaceLibrary} />
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
    const legend = this.state.createForm ? "Create content library" : "Edit content library";

    return (
      <RequestForm
        requests={this.props.requests}
        requestId={this.state.submitRequestId}
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
          requestId={this.state.loadRequestId}
          requests={this.props.requests}
          OnRequestComplete={this.OnContentLibraryLoaded}
        />
      );
    }
  }
}

export default ContentLibraryForm;
