import React from "react";
import "browser-solc";
import RequestForm from "../../forms/RequestForm";

class CompileContractForm extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      compileRequestId: undefined,
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
      compileRequestId: this.props.CompileContracts(this.state.files)
    });
  }

  Errors() {
    if(!this.props.contracts.errors) { return null; }

    return (
      <pre>
        { JSON.stringify(this.props.contracts.errors, null, 2)}
      </pre>
    );
  }

  ContractFileForm() {
    return (
      <div className="contracts-form-data">
        <div className="labelled-input">
          <label className="label" htmlFor="contract-files">Contract File(s)</label>
          <input name="contract-files" type="file" multiple={true} onChange={this.HandleFileSelect} />
        </div>
        { this.Errors() }
      </div>
    );
  }

  render() {
    return (
      <RequestForm
        requests={this.props.requests}
        requestId={this.state.compileRequestId}
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
