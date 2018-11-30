import React from "react";
import Path from "path";
import RequestForm from "../../forms/RequestForm";
import RequestPage from "../RequestPage";
import Link from "react-router-dom/es/Link";

class DeployContractForm extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      libraryId: this.props.match.params.libraryId,
      objectId: this.props.match.params.objectId,
      selectedContract: "",
      contractRequestId: undefined,
      deployRequestId: undefined
    };

    this.HandleContractsLoaded = this.HandleContractsLoaded.bind(this);
    this.HandleContractChange = this.HandleContractChange.bind(this);
    this.HandleConstructorInputChange = this.HandleConstructorInputChange.bind(this);
    this.HandleSubmit = this.HandleSubmit.bind(this);
  }

  componentDidMount() {
    // Load available contracts
    this.setState({
      contractRequestId: this.props.ListContracts()
    });
  }

  // Initialize selected contract to be the first contract in the list
  HandleContractsLoaded() {
    const firstContract = Object.keys(this.props.contracts.contracts)[0];

    this.setState({
      contracts: this.props.contracts.contracts,
      selectedContract: firstContract
    });

    this.HandleContractChange({target: { value: firstContract}})
  }

  // When selected contract is changed, find the constructor description in the ABI
  // and reset the constructor input state
  HandleContractChange(event) {
    if(!this.state.contracts) { return null; }

    const contractName = event.target.value;
    const contractAbi = this.state.contracts[contractName].abi;

    const constructor = contractAbi.find((method) => {
      return method.type === "constructor";
    });

    // Ensure state is initialized so react doesn't complain about uncontrolled inputs
    let constructorInputs = {};
    if(constructor && constructor.inputs) {
      constructor.inputs.map(input => {
        constructorInputs[input.name] = "";
      });
    }

    this.setState({
      selectedContract: event.target.value,
      constructorInputs,
      constructor
    });
  }

  HandleConstructorInputChange(event) {
    this.setState({
      constructorInputs: {
        ...this.state.constructorInputs,
        [event.target.name]: event.target.value
      }
    });
  }

  // User input for any constructor arguments
  ConstructorInput() {
    if(!this.state.constructor || !this.state.constructor.inputs) { return []; }

    return this.state.constructor.inputs.map((input) => {
      return this.state.constructorInputs[input.name];
    });
  }

  HandleSubmit() {
    const contract = this.state.contracts[this.state.selectedContract];
    const deployRequestId = this.props.DeployContentContract({
      libraryId: this.state.libraryId,
      objectId: this.state.objectId,
      contractName: this.state.selectedContract,
      contractDescription: contract.description,
      abi: contract.abi,
      bytecode: contract.bytecode,
      inputs: this.ConstructorInput()
    });

    this.setState({
      deployRequestId
    });
  }

  // Automatically generated fields for constructor inputs based on ABI description
  ConstructorForm() {
    if(!this.state.constructor || !this.state.constructor.inputs) { return null; }

    return this.state.constructor.inputs.map((input) => {
      return (
        <div className="labelled-input" key={"constructor-input-" + input.name}>
          <label className="label" htmlFor={input.name}>{input.name}</label>
          <input
            name={input.name}
            value={this.state.constructorInputs[input.name]}
            onChange={this.HandleConstructorInputChange} />
        </div>
      );
    });
  }

  AvailableContracts() {
    const options = Object.keys(this.state.contracts).map(contractName => {
      return <option key={contractName} value={contractName}>{contractName}</option>;
    });

    return (
      <select name="selectedContract" onChange={this.HandleContractChange}>
        { options }
      </select>
    );
  }

  ContractFileForm() {
    return (
      <div className="contracts-form-data">
        <div className="labelled-input">
          <label className="label" htmlFor="selectedContract">Contract</label>
          { this.AvailableContracts() }
        </div>
        <div className="labelled-input">
          <label className="label text-label" htmlFor="selectedContractDescription">Description</label>
          <div className="form-text">{this.state.contracts[this.state.selectedContract].description}</div>
        </div>
        { this.ConstructorForm() }
      </div>
    );
  }

  PageContent() {
    if(!this.state.contracts) { return null; }

    if(Object.keys(this.state.contracts).length === 0){
      return (
        <div className="page-container">
          <div className="actions-container">
            <Link className="action secondary" to={Path.dirname(this.props.match.url)}>Back</Link>
          </div>
          <h3 className="page-header">
            No custom contracts available
          </h3>
        </div>
      );
    }

    return (
      <RequestForm
        requests={this.props.requests}
        requestId={this.state.deployRequestId}
        legend={"Set custom contract"}
        formContent={this.ContractFileForm()}
        redirectPath={Path.dirname(this.props.match.url)}
        cancelPath={Path.dirname(this.props.match.url)}
        OnSubmit={this.HandleSubmit}
      />
    );
  }

  render() {
    // Load available contracts
    return (
      <RequestPage
        pageContent={this.PageContent()}
        requestId={this.state.contractRequestId}
        requests={this.props.requests}
        OnRequestComplete={this.HandleContractsLoaded}
      />
    )
  }
}

export default DeployContractForm;
