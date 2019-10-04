import React from "react";
import Path from "path";
import {Action, AsyncComponent, BrowseWidget, Form} from "elv-components-js";
import {inject, observer} from "mobx-react";

@inject("objectStore")
@observer
class ContentObjectPartsForm extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      encrypt: true,
      progress: {}
    };

    this.PageContent = this.PageContent.bind(this);
    this.HandleFileSelect = this.HandleFileSelect.bind(this);
    this.HandleSubmit = this.HandleSubmit.bind(this);
  }

  HandleFileSelect(event) {
    this.setState({
      files: event.target.files,
    });
  }

  async HandleSubmit() {
    const callback = ({uploaded, total, filename}) => {
      const progress = `${(uploaded * 100 / total).toFixed(1)}%`;

      this.setState({
        progress: {
          ...this.state.progress,
          [filename]: progress
        }}
      );
    };

    await this.props.objectStore.UploadParts({
      libraryId: this.props.objectStore.libraryId,
      objectId: this.props.objectStore.objectId,
      files: this.state.files,
      encrypt: this.state.encrypt,
      callback
    });
  }

  PageContent() {
    return (
      <div>
        <div className="actions-container manage-actions">
          <Action type="link" to={Path.dirname(this.props.match.url)} className="secondary">Back</Action>
        </div>
        <Form
          legend={`Upload parts to ${this.props.objectStore.object.meta.name || this.props.objectStore.objectId}`}
          redirectPath={Path.dirname(this.props.match.url)}
          cancelPath={Path.dirname(this.props.match.url)}
          className="small-form"
          OnSubmit={this.HandleSubmit}
        >
          <div className="form-content">
            <label htmlFor="files" className="align-top">Files</label>
            <BrowseWidget
              name="files"
              onChange={this.HandleFileSelect}
              required={true}
              multiple={true}
              progress={this.state.progress}
            />

            <label htmlFor="encrypt">Encrypt Parts</label>
            <input
              type="checkbox"
              name="encrypt"
              value={this.state.encrypt}
              checked={this.state.encrypt}
              onChange={() => { this.setState({encrypt: !this.state.encrypt}); }}
            />
          </div>
        </Form>
      </div>
    );
  }

  render() {
    return (
      <AsyncComponent
        Load={
          async () => {
            await this.props.objectStore.ContentObject({
              libraryId: this.props.objectStore.libraryId,
              objectId: this.props.objectStore.objectId
            });
          }
        }
        render={this.PageContent}
      />
    );
  }
}

export default ContentObjectPartsForm;
