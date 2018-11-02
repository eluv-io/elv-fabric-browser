import React from "react";
import RequestForm from "../../forms/RequestForm";

class ContentLibraryForm extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      name: "",
      description: ""
    };

    this.FormContent = this.FormContent.bind(this);
    this.HandleInputChange = this.HandleInputChange.bind(this);
    this.HandleSubmit = this.HandleSubmit.bind(this);
  }

  HandleInputChange(event) {
    this.setState({
      [event.target.name]: event.target.value
    });
  }

  HandleSubmit({signer}) {
    let requestId = this.props.CreateContentLibrary({
      name: this.state.name,
      description: this.state.description,
      signer
    });

    this.setState({ formSubmitRequestId: requestId });
  }

  FormContent() {
    return (
      <div className="form-content">
        <div className="labelled-input">
          <label htmlFor="name">Name</label>
          <input name="name" value={this.state.name} onChange={this.HandleInputChange} />
        </div>
        <div className="labelled-input">
          <label className="textarea-label" htmlFor="description">Description</label>
          <textarea name="description" value={this.state.description} onChange={this.HandleInputChange} />
        </div>
      </div>
    );
  }

  render() {
    return (
      <RequestForm
        requests={this.props.requests}
        requestId={this.state.formSubmitRequestId}
        legend="Create a new Content Library"
        formContent={this.FormContent()}
        redirectPath={"/content"}
        cancelPath={"/content"}
        OnSubmit={this.HandleSubmit}
      />
    );
  }
}

export default ContentLibraryForm;
