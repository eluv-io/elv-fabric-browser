import React from "react";
import PropTypes from "prop-types";
import BrowseWidget from "./BrowseWidget";
import RadioSelect from "./RadioSelect";
import Form from "../forms/Form";

class FileUploadWidget extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      files: "",
      directories: false
    };

    this.HandleSubmit = this.HandleSubmit.bind(this);
  }

  async HandleSubmit() {
    await this.props.Upload(this.props.path, this.state.files);
  }

  FormContent() {
    return (
      <div>
        <RadioSelect
          name="directories"
          label="Type"
          inline={true}
          options={[["Files", false], ["Directory", true]]}
          selected={this.state.directories}
          onChange={(event) => this.setState({directories: event.target.value})}
        />
        <BrowseWidget
          label="Files"
          onChange={(event) => this.setState({files: event.target.files})}
          directories={this.state.directories}
          multiple={true}
          progress={this.props.progress}
        />
      </div>
    );
  }

  render() {
    return (
      <div className="upload-widget">
        <div className="modal-error">{this.state.error}</div>
        <Form
          legend={"Upload files to " + this.props.displayPath}
          formContent={this.FormContent()}
          noRedirect={true}
          status={this.props.uploadStatus}
          OnSubmit={this.HandleSubmit}
          OnCancel={this.props.OnCancel}
          OnError={(error) => this.setState({error})}
          OnComplete={this.props.OnComplete}
        />
      </div>
    );
  }
}

FileUploadWidget.propTypes = {
  path: PropTypes.string.isRequired,
  displayPath: PropTypes.string.isRequired,
  progress: PropTypes.object,
  uploadStatus: PropTypes.object,
  Upload: PropTypes.func.isRequired,
  OnComplete: PropTypes.func.isRequired,
  OnCancel: PropTypes.func
};

export default FileUploadWidget;
