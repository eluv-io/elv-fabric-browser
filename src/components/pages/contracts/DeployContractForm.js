import React from "react";
import Redirect from "react-router/es/Redirect";
import "browser-solc";
import RequestForm from "../../forms/RequestForm";

class DeployContractForm extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      deployRequestId: undefined,
      files: []
    };

    this.HandleContractChange = this.HandleContractChange.bind(this);
    this.HandleConstructorInputChange = this.HandleConstructorInputChange.bind(this);
    this.HandleSubmit = this.HandleSubmit.bind(this);
  }

  componentDidMount() {
    if(this.props.contracts.contractData) {
      const firstContract = Object.keys(this.props.contracts.contractData)[0];
      this.HandleContractChange({target: {value: firstContract}});
    }
  }

  HandleContractChange(event) {
    if(!this.props.contracts.contractData) { return; }

    const contractName = event.target.value;
    const contract = this.props.contracts.contractData[contractName];

    const constructor = contract.interface.find(func => {
      return func.type === "constructor";
    });

    // Ensure state is initialized so react doesn't complain about uncontrolled inputs
    let constructorInputs = {};
    if(constructor && constructor.inputs) {
      constructor.inputs.map(input => {
        constructorInputs[input.name] = "";
      });
    }

    this.setState({
      selectedContract: contractName,
      contract,
      constructor,
      constructorInputs
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

  ConstructorInput() {
    if(!this.state.constructor || !this.state.constructor.inputs) { return []; }

    return this.state.constructor.inputs.map((input) => {
      return this.state.constructorInputs[input.name];
    });
  }

  HandleSubmit() {
    this.props.DeployContract({
      abi: this.state.contract.interface,
      bytecode: this.state.contract.bytecode,
      inputs: this.ConstructorInput()
    });
  }

  AvailableContracts() {
    const options = Object.keys(this.props.contracts.contractData).map(contract => {
      return <option key={contract} value={contract}>{contract}</option>;
    });

    return (
      <select name="selectedContract" onChange={this.HandleContractChange}>
        { options }
      </select>
    );
  }

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

  ContractFileForm() {
    return (
      <div className="contracts-form-data">
        <div className="labelled-input">
          <label className="label" htmlFor="selectedContract">Contract</label>
          { this.AvailableContracts() }
        </div>
        {this.ConstructorForm()}
      </div>
    );
  }

  render() {
    // Ensure contract data is set
    if(!this.props.contracts.contractData) {
      this.props.SetErrorMessage({
        message: "No contract data",
        redirect: true
      });

      return <Redirect to="/contracts" />;
    }

    return (
      <RequestForm
        requests={this.props.requests}
        requestId={this.state.compileRequestId}
        legend={"Deploy new contracts"}
        formContent={this.ContractFileForm()}
        cancelPath="/contracts"
        OnSubmit={this.HandleSubmit}
        OnComplete={() => { this.setState({compileRequestId: undefined}); }}
      />
    );
  }
}

export default DeployContractForm;
