import React from "react";
import Path from "path";
import RequestForm from "../../forms/RequestForm";
import BrowseWidget from "../../components/BrowseWidget";

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

  HandleSubmit() {
    let requestId = this.props.UploadParts({
      libraryId: this.state.libraryId,
      objectId: this.state.objectId,
      files: this.state.files
    });

    this.setState({ formSubmitRequestId: requestId });
  }

  FormContent() {
    return <BrowseWidget label="Files" onChange={this.HandleFileSelect} required={true} multiple={true}/>;
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
