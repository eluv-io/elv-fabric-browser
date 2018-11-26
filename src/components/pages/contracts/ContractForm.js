import React from "react";
import Redirect from "react-router/es/Redirect";
import "browser-solc";
import RequestForm from "../../forms/RequestForm";
import RequestPage from "../RequestPage";
import Path from "path";

class ContractForm extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      contractName: this.props.match.params.contractName,
      name: "",
      description: "",
      abi: "",
      bytecode: "",
      submitRequestId: undefined,
      loadRequestId: undefined,
      createForm: !this.props.location.pathname.endsWith("edit")
    };

    this.SetContract = this.SetContract.bind(this);
    this.SwitchContract = this.SwitchContract.bind(this);
    this.HandleInputChange = this.HandleInputChange.bind(this);
    this.HandleSubmit = this.HandleSubmit.bind(this);
  }

  componentDidMount() {
    if(!this.state.createForm) {
      this.setState({
        loadRequestId: this.props.ListContracts()
      })
    }

    if(this.props.contracts.contractData) {
      const firstContractName = Object.keys(this.props.contracts.contractData)[0];
      this.SwitchContract(firstContractName);
    }
  }

  HandleInputChange(event) {
    this.setState({
      [event.target.name]: event.target.value
    });
  }

  SetContract() {
    if(!this.props.contracts.contracts) { return; }

    const contractInfo = this.props.contracts.contracts[this.state.contractName];

    this.setState({
      name: this.state.contractName,
      description: contractInfo.description,
      abi: contractInfo.abi,
      bytecode: contractInfo.bytecode,
      contract: contractInfo
    });
  }

  SwitchContract(contractName) {
    if(!this.props.contracts.contractData) { return; }

    const formattedName = contractName.split(":").slice(-1)[0];
    const contract = this.props.contracts.contractData[contractName];

    this.setState({
      name: formattedName,
      selectedContract: contractName,
      abi: contract.interface,
      bytecode: contract.bytecode,
      contract,
    });
  }

  HandleSubmit() {
    this.setState({
      submitRequestId: this.props.SaveContract({
        name: this.state.name,
        oldContractName: this.state.contractName || this.state.name,
        description: this.state.description,
        abi: this.state.contract.interface || this.state.contract.abi,
        bytecode: this.state.contract.bytecode
      })
    });
  }

  AvailableContracts() {
    const options = Object.keys(this.props.contracts.contractData).map(contract => {
      return <option key={contract} value={contract}>{contract}</option>;
    });

    return (
      <select name="selectedContract" onChange={(event) => this.SwitchContract(event.target.value)}>
        { options }
      </select>
    );
  }

  ContractSelection() {
    if(!this.state.createForm) { return null; }

    return (
      <div className="labelled-input">
        <label className="label" htmlFor="selectedContract">Contract</label>
        { this.AvailableContracts() }
      </div>
    );
  }

  ContractForm() {
    return (
      <div className="contracts-form-data">
        <div className="labelled-input">
          <label className="label" htmlFor="name">Name</label>
          <input name="name" value={this.state.name} onChange={this.HandleInputChange} />
        </div>
        { this.ContractSelection() }
        <div className="labelled-input">
          <label className="label" htmlFor="description">Description</label>
          <textarea name="description" value={this.state.description} onChange={this.HandleInputChange} />
        </div>
      </div>
    );
  }

  PageContent() {
    if(!this.state.createForm && !this.state.contract) { return null; }

    // If name changes, make sure to update redirect path to new name
    const redirectPath = this.state.createForm ?
      this.props.match.url :
      this.props.match.url.replace(this.state.contractName, this.state.name);

    return (
      <RequestForm
        requests={this.props.requests}
        requestId={this.state.submitRequestId}
        legend={"Save contract"}
        formContent={this.ContractForm()}
        redirectPath={Path.dirname(redirectPath)}
        cancelPath={Path.dirname(this.props.match.url)}
        OnSubmit={this.HandleSubmit}
      />
    );
  }

  render() {
    if (this.state.createForm) {
      // Ensure contract data is set from compilation
      if (!this.props.contracts.contractData) {
        this.props.SetErrorMessage({
          message: "No contract data",
          redirect: true
        });

        return <Redirect to="/contracts"/>;
      }
      return this.PageContent();
    } else {
      return (
        <RequestPage
          requests={this.props.requests}
          requestId={this.state.loadRequestId}
          pageContent={this.PageContent()}
          OnRequestComplete={this.SetContract}
        />
      )
    }
  }
}

export default ContractForm;
