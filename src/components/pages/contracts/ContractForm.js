import React from "react";
import {Redirect} from "react-router";
import {Action, Form} from "elv-components-js";
import AsyncComponent from "../../components/AsyncComponent";
import Path from "path";
import UrlJoin from "url-join";
import {inject, observer} from "mobx-react";

@inject("contractStore")
@observer
class ContractForm extends React.Component {
  constructor(props) {
    super(props);

    //const contract = props.contract || this.props.contractData && Object.keys(this.props.contractData)[0] || {};

    // Keep redirect path synchronized with name changes
    this.state = {
      contractName: "",
      name: "",
      description: "",
      abi: "",
      bytecode: "",
    };

    this.PageContent = this.PageContent.bind(this);
    this.SwitchContract = this.SwitchContract.bind(this);
    this.HandleInputChange = this.HandleInputChange.bind(this);
    this.HandleSubmit = this.HandleSubmit.bind(this);
  }

  HandleInputChange(event) {
    this.setState({
      [event.target.name]: event.target.value
    });
  }

  SwitchContract(contractName) {
    if(!this.props.contractStore.compiledContracts) { return; }

    const formattedName = contractName.split(":").slice(-1)[0];
    const contract = this.props.contractStore.compiledContracts[contractName];

    this.setState({
      name: formattedName,
      selectedContract: contractName,
      abi: contract.interface,
      bytecode: contract.bytecode,
      contract,
    });
  }

  async HandleSubmit() {
    await this.props.contractStore.SaveContract({
      name: this.state.name,
      oldContractName: this.state.contractName || this.state.name,
      description: this.state.description,
      abi: this.state.contract.interface || this.state.contract.abi,
      bytecode: this.state.contract.bytecode
    });
  }

  AvailableContracts() {
    const options = Object.keys(this.props.contractStore.compiledContracts).map(contract => {
      return <option key={contract} value={contract}>{contract}</option>;
    });

    return (
      <select key={"contract-options"} name="selectedContract" onChange={(event) => this.SwitchContract(event.target.value)}>
        { options }
      </select>
    );
  }

  ContractSelection() {
    if(!this.state.createForm) { return null; }

    return [
      <label key="selected-contract-label" htmlFor="selectedContract">Contract</label>,
      this.AvailableContracts()
    ];
  }

  PageContent() {
    if(this.state.createForm) {
      // Ensure contract data is set from compilation
      if(!this.props.contractStore.compiledContracts) {
        return <Redirect to={Path.dirname(this.props.match.url)}/>;
      }
    }

    let backPath = Path.dirname(this.props.match.url);
    if(this.props.contractStore.contract) {
      backPath = UrlJoin(Path.dirname(Path.dirname(this.props.match.url)), this.state.name);
    }

    return (
      <div className="page-container">
        <div className="actions-container manage-actions">
          <Action type="link" to={backPath} className="secondary">Back</Action>
        </div>
        <Form
          legend={this.state.createForm ? "Save contract" : "Edit Contract"}
          redirectPath={backPath}
          cancelPath={backPath}
          OnSubmit={this.HandleSubmit}
        >
          <div className="form-content">
            <label htmlFor="name">Name</label>
            <input name="name" required={true} value={this.state.name} onChange={this.HandleInputChange} />

            { this.ContractSelection() }

            <label htmlFor="description" className="align-top">Description</label>
            <textarea name="description" value={this.state.description} onChange={this.HandleInputChange} />
          </div>
        </Form>
      </div>
    );
  }

  render() {
    return (
      <AsyncComponent
        Load={
          async () => {
            await this.props.contractStore.ListContracts({params: {paginate: false}});
            await this.props.contractStore.ListDeployedContracts({params: {paginate: false}});

            const contract = this.props.contractStore.contract || {};

            // Keep redirect path synchronized with name changes
            this.setState({
              createForm: !this.props.contractStore.contract,
              contract,
              contractName: contract.name,
              name: contract.name || "",
              description: contract.description || "",
              abi: contract.abi || "",
              bytecode: contract.bytecode || ""
            });

            if(this.state.createForm && this.props.contractStore.compiledContracts) {
              const firstContractName = Object.keys(this.props.contractStore.compiledContracts)[0];
              this.SwitchContract(firstContractName);
            }
          }
        }
        render={this.PageContent}
      />
    );
  }
}

export default ContractForm;
