import React from "react";
import PropTypes from "prop-types";
import RequestForm from "../forms/RequestForm";
import BrowseWidget from "./BrowseWidget";
import RadioSelect from "./RadioSelect";

class UploadWidget extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      files: "",
      directories: false
    };

    this.HandleSubmit = this.HandleSubmit.bind(this);
  }

  HandleSubmit() {
    this.setState({
      requestId: this.props.WrapRequest({
        modal: true,
        todo: () => this.props.Upload(this.props.path, this.state.files)
      })
    });
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
        <RequestForm
          requests={this.props.requests}
          requestId={this.state.requestId}
          legend={"Upload files to " + this.props.displayPath}
          formContent={this.FormContent()}
          redirect={false}
          OnSubmit={this.HandleSubmit}
          OnCancel={this.props.OnCancel}
          OnError={(error) => this.setState({error})}
          OnComplete={this.props.OnComplete}
        />
      </div>
    );
  }
}

UploadWidget.propTypes = {
  requests: PropTypes.object.isRequired,
  path: PropTypes.string.isRequired,
  displayPath: PropTypes.string.isRequired,
  progress: PropTypes.object,
  Upload: PropTypes.func.isRequired,
  WrapRequest: PropTypes.func.isRequired,
  OnComplete: PropTypes.func.isRequired,
  OnCancel: PropTypes.func
};

export default UploadWidget;
