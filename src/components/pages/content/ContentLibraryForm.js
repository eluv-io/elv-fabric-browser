import React from "react";
import UrlJoin from "url-join";
import Path from "path";
import {BrowseWidget, Form, JsonInput} from "elv-components-js";
import {inject, observer} from "mobx-react";
import AsyncComponent from "../../components/AsyncComponent";
import ActionsToolbar from "../../components/ActionsToolbar";

@inject("libraryStore")
@observer
class ContentLibraryForm extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      createForm: !props.libraryStore.libraryId,
      name: "",
      description: "",
      publicMetadata: "{}",
      privateMetadata: "{}",
      kmsId: "",
      imageSelection: "",
      tenantId: ""
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
    const Method = this.state.createForm ?
      this.props.libraryStore.CreateContentLibrary :
      this.props.libraryStore.UpdateContentLibrary;

    const libraryId = await Method({
      libraryId: this.props.libraryStore.libraryId,
      name: this.state.name,
      description: this.state.description,
      publicMetadata: this.state.publicMetadata,
      privateMetadata: this.state.privateMetadata,
      image: this.state.imageSelection,
      kmsId: this.state.kmsId
    });

    this.setState({
      libraryId,
    });
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
    const legend = this.state.createForm ? "Create content library" : "Manage content library";

    const backPath = Path.dirname(this.props.match.url);
    const redirectPath = this.state.createForm ? UrlJoin(backPath, this.state.libraryId || "") : backPath;

    return (
      <div className="page-container">
        <ActionsToolbar
          showContentLookup={false}
          actions={[
            {
              label: "Back",
              type: "link",
              path: Path.dirname(this.props.match.url),
              className: "secondary"
            }
          ]}
        />
        <div className="page-content-container">
          <div className="page-content">
            <Form
              legend={legend}
              redirectPath={redirectPath}
              cancelPath={Path.dirname(this.props.match.url)}
              OnSubmit={this.HandleSubmit}
              className="form-page"
            >
              <div className="form-content">
                <label htmlFor="name">Name</label>
                <input name="name" value={this.state.name} required={true} onChange={this.HandleInputChange} disabled={this.state.isContentSpaceLibrary} />

                { this.Image() }

                <label htmlFor="tenantId">Tenant ID</label>
                <input name="tenantId" type="text" value={this.state.tenantId} required={true} onChange={this.HandleInputChange} />

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
                  <span className="help-text" hidden={!this.state.createForm}>(optional)</span>
                </label>
                <input name="kmsId" value={this.state.kmsId} required={false} onChange={this.HandleInputChange} disabled={!this.state.createForm}/>
              </div>
            </Form>
          </div>
        </div>
      </div>
    );
  }

  render() {
    return (
      <AsyncComponent
        Load={
          async () => {
            if(this.state.createForm) {
              this.setState({
                kmsId: await this.props.libraryStore.DefaultKMSId() || "",
                tenantId: await this.props.libraryStore.DefaultTenantId() || ""
              });
            } else {
              await this.props.libraryStore.ContentLibrary({
                libraryId: this.props.libraryStore.libraryId
              });

              this.setState({
                name: this.props.libraryStore.library.name || "",
                description: this.props.libraryStore.library.description || "",
                publicMetadata: JSON.stringify(this.props.libraryStore.library.publicMeta, null, 2) || "",
                privateMetadata: JSON.stringify(this.props.libraryStore.library.privateMeta, null, 2) || "",
                kmsId: this.props.libraryStore.library.kmsId || "",
              });
            }
          }
        }
        render={this.PageContent}
      />
    );
  }
}

export default ContentLibraryForm;
