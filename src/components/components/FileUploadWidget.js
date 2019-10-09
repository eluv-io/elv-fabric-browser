import React from "react";
import PropTypes from "prop-types";
import {BrowseWidget, Form, RadioSelect} from "elv-components-js";

class FileUploadWidget extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      files: "",
      directories: false,
      progress: {}
    };

    this.HandleSubmit = this.HandleSubmit.bind(this);
  }

  async HandleSubmit() {
    const callback = progress => {
      let percentage = {};
      Object.keys(progress).map(path => {
        const filename = path.split("/").slice(-1)[0];
        const {uploaded, total} = progress[path];
        percentage[filename] = total > 0 ? `${(uploaded * 100 / total).toFixed(1)}%` : "100.0%";
      });

      this.setState({progress: percentage});
    };

    await this.props.Upload({
      path: this.props.path,
      fileList: this.state.files,
      isDirectory: this.state.directories,
      callback
    });
  }

  render() {
    return (
      <div className="upload-widget">
        <Form
          legend={this.props.legend}
          OnSubmit={this.HandleSubmit}
          OnCancel={this.props.OnCancel}
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
              progress={this.state.progress}
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
  Upload: PropTypes.func.isRequired,
  OnComplete: PropTypes.func.isRequired,
  OnCancel: PropTypes.func
};

export default FileUploadWidget;
