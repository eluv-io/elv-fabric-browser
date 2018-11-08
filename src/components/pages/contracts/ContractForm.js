import React from "react";
import Redirect from "react-router/es/Redirect";
import "browser-solc";
import RequestForm from "../../forms/RequestForm";

class ContractForm extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      name: "",
      description: "",
      requestId: undefined,
      files: []
    };

    this.HandleInputChange = this.HandleInputChange.bind(this);
    this.HandleContractChange = this.HandleContractChange.bind(this);
    this.HandleSubmit = this.HandleSubmit.bind(this);
  }

  componentDidMount() {
    if(this.props.contracts.contractData) {
      const firstContract = Object.keys(this.props.contracts.contractData)[0];
      this.HandleContractChange({target: {value: firstContract}});
    }
  }

  HandleInputChange(event) {
    console.log("handling input change");
    this.setState({
      [event.target.name]: event.target.value
    });
  }

  HandleContractChange(event) {
    if(!this.props.contracts.contractData) { return; }

    const contractName = event.target.value;
    const formattedName = contractName.split(":").slice(-1)[0];
    const contract = this.props.contracts.contractData[contractName];

    this.setState({
      name: formattedName,
      selectedContract: contractName,
      contract,
    });
  }

  HandleSubmit() {
    this.setState({
      requestId: this.props.SaveContract({
        name: this.state.name,
        description: this.state.description,
        abi: this.state.contract.interface,
        bytecode: this.state.contract.bytecode
      })
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

  ContractFileForm() {
    return (
      <div className="contracts-form-data">
        <div className="labelled-input">
          <label className="label" htmlFor="name">Name</label>
          <input name="name" value={this.state.name} onChange={this.HandleInputChange} />
        </div>
        <div className="labelled-input">
          <label className="label" htmlFor="selectedContract">Contract</label>
          { this.AvailableContracts() }
        </div>
        <div className="labelled-input">
          <label className="label" htmlFor="description">Description</label>
          <textarea name="description" value={this.state.description} onChange={this.HandleInputChange} />
        </div>
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
        requestId={this.state.requestId}
        legend={"Save contract"}
        formContent={this.ContractFileForm()}
        redirectPath="/contracts"
        cancelPath="/contracts"
        OnSubmit={this.HandleSubmit}
      />
    );
  }
}

export default ContractForm;
