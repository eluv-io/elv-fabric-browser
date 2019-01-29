import React from "react";
import Path from "path";
import RequestForm from "../../forms/RequestForm";
import BrowseWidget from "../../components/BrowseWidget";

class ContentAppForm extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      libraryId: this.props.libraryId || this.props.match.params.libraryId,
      objectId: this.props.match.params.objectId,
      role: this.props.match.params.role
    };

    this.FormContent = this.FormContent.bind(this);
    this.HandleFileSelect = this.HandleFileSelect.bind(this);
    this.HandleSubmit = this.HandleSubmit.bind(this);
  }

  HandleFileSelect(event) {
    this.setState({
      appFile: event.target.files
    });
  }

  HandleSubmit() {
    this.setState({
      requestId: this.props.WrapRequest({
        todo: async () => {
          await this.props.AddApp({
            libraryId: this.state.libraryId,
            objectId: this.state.objectId,
            role: this.state.role,
            file: this.state.appFile
          });
        }
      })
    });
  }

  FormContent() {
    return (
      <BrowseWidget
        label="App"
        onChange={this.HandleFileSelect}
        accept={"text/html"}
        multiple={false}
        required={true}
      />
    );
  }

  render() {
    return (
      <RequestForm
        legend={`Add ${this.state.role.capitalize()} App`}
        requestId={this.state.requestId}
        requests={this.props.requests}
        formContent={this.FormContent()}
        OnSubmit={this.HandleSubmit}
        redirectPath={Path.dirname(Path.dirname(this.props.match.url))}
        cancelPath={Path.dirname(Path.dirname(this.props.match.url))}
      />
    );
  }
}

export default ContentAppForm;
