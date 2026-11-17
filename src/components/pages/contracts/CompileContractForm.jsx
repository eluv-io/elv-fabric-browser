import React from "react";
import {BrowseWidget, Form, JsonInput, RadioSelect} from "elv-components-js";
import UrlJoin from "url-join";
import Path from "path";
import {inject, observer} from "mobx-react";
import ActionsToolbar from "../../components/ActionsToolbar";

@inject("contractStore")
@observer
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

    if(event.target.name === "compileFromSource") {
      this.setState({errors: undefined});
    }
  }

  HandleFileSelect(event) {
    this.setState({
      files: event.target.files
    });
  }

  async HandleSubmit() {
    if(this.state.compileFromSource) {
      try {
        await this.props.contractStore.CompileContracts(this.state.files);
      } catch(errors) {
        this.setState({
          errors
        });

        throw "Compilation Error";
      }
    } else {
      await this.props.contractStore.SaveContract({
        name: this.state.name,
        description: this.state.description,
        abi: this.state.abi,
        bytecode: this.state.bytecode,
      });
    }
  }

  Errors() {
    if(!this.state.errors) { return null; }

    return (
      <pre>
        { "Compilation errors: \n\n" + this.state.errors }
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
        <JsonInput
          name="abi"
          value={this.state.abi}
          required={true}
          onChange={this.HandleInputChange}
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
          //accept=".sol"
        />
      </div>
    );
  }

  render() {
    const backPath = Path.dirname(this.props.match.url);
    const redirectPath = this.state.compileFromSource ? UrlJoin(backPath, "save") : UrlJoin(backPath, "saved");

    return (
      <div className="page-container">
        <ActionsToolbar
          showContentLookup={false}
          actions={[
            {
              label: "Back",
              type: "link",
              path: Path.dirname(this.props.match.url),
              className: "secondary"
            }
          ]}
        />
        <Form
          legend={"Compile contracts"}
          redirectPath={redirectPath}
          cancelPath={backPath}
          status={status}
          OnSubmit={this.HandleSubmit}
          className="small-form form-page"
        >
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
        </Form>
      </div>
    );
  }
}

export default CompileContractForm;
