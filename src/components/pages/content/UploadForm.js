import React from "react";
import Path from "path";
import RequestForm from "../../forms/RequestForm";
import BrowseWidget from "../../components/BrowseWidget";

class ContentObjectUploadForm extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      libraryId: this.props.libraryId || this.props.match.params.libraryId,
      objectId: this.props.match.params.objectId,
      encrypt: true,
      progress: {}
    };

    this.FormContent = this.FormContent.bind(this);
    this.HandleFileSelect = this.HandleFileSelect.bind(this);
    this.HandleSubmit = this.HandleSubmit.bind(this);
  }

  HandleFileSelect(event) {
    this.setState({
      files: event.target.files,
    });
  }

  HandleSubmit() {
    const callback = ({uploaded, total, filename}) => {
      this.setState({
        progress: {
          ...this.state.progress,
          [filename]: (uploaded * 100 / total).toFixed(1)
        }}
      );
    };

    this.setState({
      submitRequestId: this.props.WrapRequest({
        todo: async () => {
          await this.props.UploadParts({
            libraryId: this.state.libraryId,
            objectId: this.state.objectId,
            files: this.state.files,
            encrypt: this.state.encrypt,
            callback
          });
        }
      })
    });
  }

  FormContent() {
    return (
      <div className="upload-form">
        <BrowseWidget label="Files" onChange={this.HandleFileSelect} required={true} multiple={true} progress={this.state.progress}/>
        <div className="labelled-input">
          <label htmlFor="encrypt">Encrypt Parts</label>
          <input
            type="checkbox"
            name="encrypt"
            value={this.state.encrypt}
            checked={this.state.encrypt}
            onChange={() => { this.setState({encrypt: !this.state.encrypt}); }}
          />
        </div>
      </div>
    );
  }

  render() {
    return (
      <RequestForm
        requests={this.props.requests}
        requestId={this.state.submitRequestId}
        legend="Upload parts"
        formContent={this.FormContent()}
        redirectPath={Path.dirname(this.props.match.url)}
        cancelPath={Path.dirname(this.props.match.url)}
        OnSubmit={this.HandleSubmit}
      />
    );
  }
}

export default ContentObjectUploadForm;
