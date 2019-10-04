import React from "react";
import PropTypes from "prop-types";
import {BrowseWidget, Form, RadioSelect} from "elv-components-js";

class FileUploadWidget extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      files: "",
      directories: false,
      status: {
        loading: false,
        completed: false,
        error: false,
        errorMessage: ""
      }
    };

    this.HandleSubmit = this.HandleSubmit.bind(this);
  }

  async HandleSubmit() {
    this.setState({
      status: {
        loading: true,
        completed: false,
        error: false,
        errorMessage: ""
      }
    });

    try {
      await this.props.Upload(this.props.path, this.state.files, this.state.directories);

      this.setState({
        status: {
          loading: false,
          completed: true
        }
      });
    } catch(error) {
      this.setState({
        status: {
          loading: false,
          completed: false,
          error: true,
          errorMessage: error.message
        }
      });
    }
  }

  render() {
    return (
      <div className="upload-widget">
        <div className="modal-error">{this.state.error}</div>
        <Form
          legend={this.props.legend}
          status={this.state.status}
          OnSubmit={this.HandleSubmit}
          OnCancel={this.props.OnCancel}
          OnError={(error) => this.setState({error})}
          OnComplete={this.props.OnComplete}
        >
          <div className="form-content">
            <label htmlFor="directories">Type</label>
            <RadioSelect
              name="directories"
              inline={true}
              options={[["Files", false], ["Directory", true]]}
              selected={this.state.directories}
              onChange={(event) => this.setState({directories: event.target.value})}
            />

            <label htmlFor="files">{this.state.directories ? "Directory" : "Files"}</label>
            <BrowseWidget
              name="files"
              onChange={(event) => this.setState({files: event.target.files})}
              directories={this.state.directories}
              multiple={true}
              progress={this.props.progress}
            />
          </div>
        </Form>
      </div>
    );
  }
}

FileUploadWidget.propTypes = {
  legend: PropTypes.string.isRequired,
  path: PropTypes.string,
  progress: PropTypes.object,
  uploadStatus: PropTypes.object,
  Upload: PropTypes.func.isRequired,
  OnComplete: PropTypes.func.isRequired,
  OnCancel: PropTypes.func
};

export default FileUploadWidget;
