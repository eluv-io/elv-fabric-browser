/*
import React from "react";
import UrlJoin from "url-join";
import Path from "path";
import {BrowseWidget, Form, JsonInput} from "elv-components-js";
import {observer} from "mobx-react";
import AsyncComponent from "@/components/AsyncComponent";
import ActionsToolbar from "@/components/ActionsToolbar";

import {libraryStore} from "@/stores";

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
      libraryStore.CreateContentLibrary :
      libraryStore.UpdateContentLibrary;

    const libraryId = await Method({
      libraryId: libraryStore.libraryId,
      name: this.state.name,
      description: this.state.description,
      publicMetadata: this.state.publicMetadata,
      privateMetadata: this.state.privateMetadata,
      image: this.state.imageSelection,
      kmsId: this.state.kmsId,
      tenantId: this.state.tenantId
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
                kmsId: await libraryStore.DefaultKMSId() || "",
                tenantId: await libraryStore.DefaultTenantId() || ""
              });
            } else {
              await libraryStore.ContentLibrary({
                libraryId: libraryStore.libraryId
              });

              this.setState({
                name: libraryStore.library.name || "",
                description: libraryStore.library.description || "",
                publicMetadata: JSON.stringify(libraryStore.library.publicMeta, null, 2) || "",
                privateMetadata: JSON.stringify(libraryStore.library.privateMeta, null, 2) || "",
                kmsId: libraryStore.library.kmsId || "",
                tenantId: await libraryStore.DefaultTenantId() || ""
              });
            }
          }
        }
        render={this.PageContent}
      />
    );
  }
}

export default observer(ContentLibraryForm);

 */

import {observer} from "mobx-react";
import {useEffect, useState} from "react";
import {libraryStore} from "@/stores";
import Form from "@/components/Form";
import JSONEditField from "@/components/JSONEditField";
import {TextInput} from "@mantine/core";
import UrlJoin from "url-join";
import {useLocation} from "wouter";

const ContentLibraryForm = observer(() => {
  const [, navigate] = useLocation();
  const [metadata, setMetadata] = useState(undefined);
  const [metadataValid, setMetadataValid] = useState(true);

  const [formData, setFormData] = useState({
    name: "New Library",
    tenantId: "",
    kmsId: ""
  });

  useEffect(() => {
    (async () => {
      if(libraryStore.libraryId) {
        await libraryStore.ContentLibrary({libraryId: libraryStore.libraryId});
        const library = libraryStore.libraries[libraryStore.libraryId];

        setMetadata(JSON.stringify(library.metadata, null, 2));
        setFormData({
          name: library.name,
          kmsId: library.kmsId,
          tenantId: library.tenantId,
        });
      } else {
        const kmsId = await libraryStore.DefaultKMSId() || "";
        const tenantId = await libraryStore.DefaultTenantId() || "";

        setFormData({
          ...formData,
          kmsId,
          tenantId
        });
        setMetadata("{}");
      }
    })();
  }, [libraryStore.libraryId]);

  useEffect(() => {
    if(typeof metadata === "undefined") { return; }

    try {
      JSON.parse(metadata);
      setMetadataValid(true);
    } catch(error) {
      setMetadataValid(false);
    }
  }, [metadata]);

  return (
    <Form
      legend={libraryStore.libraryId ? "Update Content Library" : "Create Content Library"}
      disabled={!metadataValid || !formData.name}
      showTopControls
      showBottomControls={false}
      loading={typeof metadata === "undefined"}
      cancelPath={
        libraryStore.libraryId ?
          UrlJoin("/content", libraryStore.libraryId) :
          "/content"
      }
      onSubmit={async () => {
        let libraryId;
        if(libraryStore.libraryId) {
          libraryId = await libraryStore.UpdateContentLibrary({
            libraryId: libraryStore.libraryId,
            name: formData.name,
            metadata
          });
        } else {
          libraryId = await libraryStore.CreateContentLibrary({
            name: formData.name,
            tenantId: formData.tenantId,
            kmsId: formData.kmsId,
            metadata
          });
        }

        navigate(UrlJoin("/content", libraryId));
      }}
    >
      <TextInput
        label="Name"
        required
        placeholder="Library Name..."
        value={formData.name}
        onChange={event => setFormData({...formData, name: event.target.value})}
      />
      {
        libraryStore.libraryId ? null :
          <>
            <TextInput
              label="Tenant ID"
              placeholder="Tenant Id..."
              value={formData.tenantId}
              onChange={event => setFormData({...formData, tenantId: event.target.value})}
            />
            <TextInput
              label="KMS Id"
              placeholder="KMS ID..."
              value={formData.kmsId}
              onChange={event => setFormData({...formData, kmsId: event.target.value})}
            />
          </>
      }
      <JSONEditField
        label="Metadata"
        value={metadata}
        h={libraryStore.libraryId ? 600 : 450}
        onChange={setMetadata}
      />
    </Form>
  );
});

export default ContentLibraryForm;
