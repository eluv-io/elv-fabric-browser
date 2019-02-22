import React from "react";
import PropTypes from "prop-types";
import BrowseWidget from "../../components/BrowseWidget";
import RadioSelect from "../../components/RadioSelect";
import Path from "path";
import {JsonTextArea} from "../../../utils/Input";
import Form from "../../forms/Form";

class CompileContractForm extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      compileFromSource: true,
      files: [],
      name: "",
      description: "",
      abi: "",
      bytecode: "",
      redirectPath: Path.dirname(this.props.match.url)
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

  async HandleSubmit() {
    if(this.state.compileFromSource) {
      await this.props.methods.CompileContracts(this.state.files);
    } else {
      await this.props.methods.Submit({
        name: this.state.name,
        description: this.state.description,
        abi: this.state.abi,
        bytecode: this.state.bytecode,
      });
    }

    // Ensure redirect path is updated before completion
    await new Promise(resolve =>
      this.setState({
        redirectPath: Path.join(
          this.state.redirectPath,
          this.state.compileFromSource ? "save" : this.state.name
        ),
      }, resolve)
    );
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
    const status = this.state.compileFromSource ?
      this.props.methodStatus.CompileContracts : this.props.methodStatus.Submit;

    return (
      <Form
        legend={"Compile contracts"}
        formContent={this.ContractForm()}
        redirectPath={this.state.redirectPath}
        cancelPath="/contracts"
        status={status}
        OnSubmit={this.HandleSubmit}
      />
    );
  }
}

CompileContractForm.propTypes = {
  errors: PropTypes.array,
  methods: PropTypes.shape({
    CompileContracts: PropTypes.func.isRequired,
    Submit: PropTypes.func.isRequired
  })
};

export default CompileContractForm;
