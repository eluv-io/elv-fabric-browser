import React from "react";
import PropTypes from "prop-types";
import {Action, BrowseWidget, Form, RadioSelect} from "elv-components-js";
import UrlJoin from "url-join";
import Path from "path";
import {JsonTextArea} from "../../../utils/Input";

class CompileContractForm extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      compileFromSource: true,
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
      <div className="form-content">
        <label htmlFor="name">Name</label>
        <input name="name" required={true} value={this.state.name} onChange={this.HandleInputChange} />

        <label className="align-top" htmlFor="description">Description</label>
        <textarea name="description" value={this.state.description} onChange={this.HandleInputChange} />

        <label className="align-top" htmlFor="abi">ABI</label>
        <JsonTextArea
          name="abi"
          value={this.state.abi}
          required={true}
          onChange={this.HandleInputChange}
          UpdateValue={formattedAbi => this.setState({abi: formattedAbi})}
        />

        <label className="align-top" htmlFor="bytecode">Bytecode</label>
        <textarea name="bytecode" required={true} value={this.state.bytecode} onChange={this.HandleInputChange} />
      </div>
    );
  }

  FileSelection() {
    if(!this.state.compileFromSource) { return null; }

    return (
      <div className="form-content">
        <label htmlFor="contractFiles" className="align-top">Contract Files</label>
        <BrowseWidget
          name="contractFiles"
          onChange={this.HandleFileSelect}
          required={true}
          multiple={true}
          accept=".sol"
        />
      </div>
    );
  }

  ContractForm() {
    return (
      <div>
        <div className="form-content">
          <label htmlFor="source">Source</label>
          <RadioSelect
            name="compileFromSource"
            options={[
              ["Solidity", true],
              ["ABI and Bytecode", false]
            ]}
            inline={true}
            selected={this.state.compileFromSource}
            onChange={this.HandleInputChange}
          />
        </div>

        { this.FileSelection() }
        { this.AbiForm() }
        { this.Errors() }
      </div>
    );
  }

  render() {
    const status = this.state.compileFromSource ?
      this.props.methodStatus.CompileContracts : this.props.methodStatus.Submit;

    const backPath = Path.dirname(this.props.match.url);
    const redirectPath = this.state.compileFromSource ? UrlJoin(backPath, "save") : UrlJoin(backPath, "saved");

    return (
      <div>
        <div className="actions-container manage-actions">
          <Action type="link" to={Path.dirname(this.props.match.url)} className="secondary">Back</Action>
        </div>
        <Form
          legend={"Compile contracts"}
          formContent={this.ContractForm()}
          redirectPath={redirectPath}
          cancelPath={backPath}
          status={status}
          OnSubmit={this.HandleSubmit}
        />
      </div>
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
