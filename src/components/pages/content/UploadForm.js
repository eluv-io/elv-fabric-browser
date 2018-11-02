import React from "react";
import Path from "path";
import PrettyBytes from "pretty-bytes";
import RequestForm from "../../forms/RequestForm";

class ContentObjectUploadForm extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      libraryId: this.props.match.params.libraryId,
      objectId: this.props.match.params.objectId
    };

    this.FormContent = this.FormContent.bind(this);
    this.HandleFileSelect = this.HandleFileSelect.bind(this);
    this.HandleSubmit = this.HandleSubmit.bind(this);
  }

  HandleFileSelect(event) {
    this.setState({
      files: event.target.files
    });
  }

  HandleSubmit({signer}) {
    let requestId = this.props.UploadParts({
      libraryId: this.state.libraryId,
      objectId: this.state.objectId,
      files: this.state.files,
      signer
    });

    this.setState({ formSubmitRequestId: requestId });
  }

  FileInfo() {
    if(!this.state.files) {
      return null;
    }

    return (
      <div className="file-info">
        {Array.from(this.state.files).map((file) => {
          return (
            <div key={file.name} className="labelled-input">
              <label>{file.name}</label>
              <span>{PrettyBytes(file.size)}</span>
            </div>
          );
        })}

      </div>
    );
  }

  FormContent() {
    return (
      <div className="form-content">
        <div className="labelled-input">
          <label htmlFor="files">Files</label>
          <input type="file" required multiple name="files" onChange={this.HandleFileSelect} />
        </div>
        { this.FileInfo() }
      </div>
    );
  }

  render() {
    return (
      <RequestForm
        requests={this.props.requests}
        requestId={this.state.formSubmitRequestId}
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
