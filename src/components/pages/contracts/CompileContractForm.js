import React from "react";
import "browser-solc";
import RequestForm from "../../forms/RequestForm";
import BrowseWidget from "../../components/BrowseWidget";

class CompileContractForm extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      submitRequestId: undefined,
      files: []
    };

    this.HandleFileSelect = this.HandleFileSelect.bind(this);
    this.HandleSubmit = this.HandleSubmit.bind(this);
  }

  HandleFileSelect(event) {
    this.setState({
      files: event.target.files
    });
  }

  HandleSubmit() {
    this.setState({
      submitRequestId: this.props.WrapRequest({
        todo: async () => {
          await this.props.CompileContracts(this.state.files);
        }
      })
    });
  }

  Errors() {
    if(!this.props.errors) { return null; }

    return (
      <pre>
        { "Compilation errors: \n\n" + this.props.errors }
      </pre>
    );
  }

  ContractFileForm() {
    return (
      <div className="contracts-form-data">
        <BrowseWidget
          label="Contract File(s)"
          onChange={this.HandleFileSelect}
          required={true}
          multiple={true}
        />
        { this.Errors() }
      </div>
    );
  }

  render() {
    return (
      <RequestForm
        requests={this.props.requests}
        requestId={this.state.submitRequestId}
        legend={"Compile contracts"}
        formContent={this.ContractFileForm()}
        redirectPath="/contracts/save"
        cancelPath="/contracts"
        OnSubmit={this.HandleSubmit}
      />
    );
  }
}

export default CompileContractForm;
