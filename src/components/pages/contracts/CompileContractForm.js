import React from "react";
import "browser-solc";
import RequestForm from "../../forms/RequestForm";
import BrowseWidget from "../../components/BrowseWidget";
import RadioSelect from "../../components/RadioSelect";
import Path from "path";
import {JsonTextArea} from "../../../utils/Input";

class CompileContractForm extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      compileFromSource: true,
      submitRequestId: undefined,
      files: [],
      name: "",
      description: "",
      abi: "",
      bytecode: ""
    };

    this.HandleFileSelect = this.HandleFileSelect.bind(this);
    this.HandleInputChange = this.HandleInputChange.bind(this);
    this.HandleSubmit = this.HandleSubmit.bind(this);
  }

  HandleInputChange(event) {
    this.setState({
      [event.target.name]: event.target.value
    });
  }

  HandleFileSelect(event) {
    this.setState({
      files: event.target.files
    });
  }

  HandleSubmit() {
    if(this.state.compileFromSource) {
      this.setState({
        submitRequestId: this.props.WrapRequest({
          todo: async () => {
            await this.props.CompileContracts(this.state.files);
          }
        })
      });
    } else {
      this.setState({
        submitRequestId: this.props.WrapRequest({
          todo: async () => {
            await this.props.SaveContract({
              name: this.state.name,
              description: this.state.description,
              abi: this.state.abi,
              bytecode: this.state.bytecode
            });
          }
        })
      });
    }
  }

  Errors() {
    if(!this.props.errors) { return null; }

    return (
      <pre>
        { "Compilation errors: \n\n" + this.props.errors }
      </pre>
    );
  }

  AbiForm() {
    if(this.state.compileFromSource) { return null; }

    return (
      <div className="contracts-form-data">
        <div className="labelled-input">
          <label className="label" htmlFor="name">Name</label>
          <input name="name" required={true} value={this.state.name} onChange={this.HandleInputChange} />
        </div>
        <div className="labelled-input">
          <label className="label" htmlFor="description">Description</label>
          <textarea name="description" value={this.state.description} onChange={this.HandleInputChange} />
        </div>
        <div className="labelled-input">
          <label className="label" htmlFor="abi">ABI</label>
          <JsonTextArea
            name="abi"
            value={this.state.abi}
            onChange={this.HandleInputChange}
            UpdateValue={formattedAbi => this.setState({abi: formattedAbi})}
          />
        </div>
        <div className="labelled-input">
          <label className="label" htmlFor="bytecode">Bytecode</label>
          <textarea name="bytecode" value={this.state.bytecode} onChange={this.HandleInputChange} />
        </div>
      </div>
    );
  }

  FileSelection() {
    if(!this.state.compileFromSource) { return null; }

    return (
      <div>
        <BrowseWidget
          label="Contract File(s)"
          onChange={this.HandleFileSelect}
          required={true}
          multiple={true}
          accept=".sol"
        />
        { this.Errors() }
      </div>
    );
  }

  ContractForm() {
    return (
      <div className="contracts-form-data">
        <RadioSelect
          name="compileFromSource"
          label="Source"
          options={[
            ["Solidity", true],
            ["ABI and Bytecode", false]
          ]}
          inline={true}
          selected={this.state.compileFromSource}
          onChange={this.HandleInputChange}
        />
        { this.FileSelection() }
        { this.AbiForm() }
      </div>
    );
  }

  render() {
    let redirectPath;
    if(this.state.compileFromSource) {
      // If compiling from source, must go to "save" form to finish
      redirectPath = Path.join(Path.dirname(this.props.match.url), "save");
    } else {
      // Otherwise, redirect to newly saved contract
      redirectPath = Path.join(Path.dirname(this.props.match.url), this.state.name);
    }

    return (
      <RequestForm
        requests={this.props.requests}
        requestId={this.state.submitRequestId}
        legend={"Compile contracts"}
        formContent={this.ContractForm()}
        redirectPath={redirectPath}
        cancelPath="/contracts"
        OnSubmit={this.HandleSubmit}
      />
    );
  }
}

export default CompileContractForm;
