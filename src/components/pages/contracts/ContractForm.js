import React from "react";
import PropTypes from "prop-types";
import Redirect from "react-router/es/Redirect";
import UrlJoin from "url-join";
import Path from "path";
import Form from "elv-components-js/src/components/Form";

class ContractForm extends React.Component {
  constructor(props) {
    super(props);

    const contract = props.contract || this.props.contractData && Object.keys(this.props.contractData)[0] || {};
    const redirectPath = this.props.createForm ?
      Path.dirname(this.props.match.url) : Path.dirname(Path.dirname(this.props.match.url));

    // Keep redirect path synchronized with name changes
    this.state = {
      contract,
      contractName: this.props.contractName,
      name: contract.name || "",
      description: contract.description || "",
      abi: contract.abi || "",
      bytecode: contract.bytecode || "",
      redirectPath
    };

    this.SwitchContract = this.SwitchContract.bind(this);
    this.HandleInputChange = this.HandleInputChange.bind(this);
    this.HandleSubmit = this.HandleSubmit.bind(this);
  }

  componentDidMount() {
    if(this.props.createForm && this.props.contractData) {
      const firstContractName = Object.keys(this.props.contractData)[0];
      this.SwitchContract(firstContractName);
    }
  }

  HandleInputChange(event) {
    this.setState({
      [event.target.name]: event.target.value
    });
  }

  SwitchContract(contractName) {
    if(!this.props.contractData) { return; }

    const formattedName = contractName.split(":").slice(-1)[0];
    const contract = this.props.contractData[contractName];

    this.setState({
      name: formattedName,
      selectedContract: contractName,
      abi: contract.interface,
      bytecode: contract.bytecode,
      contract,
    });
  }

  async HandleSubmit() {
    await this.props.methods.Submit({
      name: this.state.name,
      oldContractName: this.state.contractName || this.state.name,
      description: this.state.description,
      abi: this.state.contract.interface || this.state.contract.abi,
      bytecode: this.state.contract.bytecode
    });

    // Ensure redirect path is updated before completion
    await new Promise(resolve =>
      this.setState({
        redirectPath: UrlJoin(this.state.redirectPath, this.state.name),
      }, resolve)
    );
  }

  AvailableContracts() {
    const options = Object.keys(this.props.contractData).map(contract => {
      return <option key={contract} value={contract}>{contract}</option>;
    });

    return (
      <select key={"contract-options"} name="selectedContract" onChange={(event) => this.SwitchContract(event.target.value)}>
        { options }
      </select>
    );
  }

  ContractSelection() {
    if(!this.props.createForm) { return null; }

    return [
      <label key="selected-contract-label" htmlFor="selectedContract">Contract</label>,
      this.AvailableContracts()
    ];
  }

  ContractForm() {
    return (
      <div className="form-content">
        <label htmlFor="name">Name</label>
        <input name="name" required={true} value={this.state.name} onChange={this.HandleInputChange} />

        { this.ContractSelection() }

        <label htmlFor="description" className="align-top">Description</label>
        <textarea name="description" value={this.state.description} onChange={this.HandleInputChange} />
      </div>
    );
  }

  render() {
    if(this.props.createForm) {
      // Ensure contract data is set from compilation
      if (!this.props.contractData) {
        this.props.SetErrorMessage({
          message: "No contract data",
          redirect: true
        });

        return <Redirect to="/contracts"/>;
      }
    }

    return (
      <Form
        legend={"Save contract"}
        formContent={this.ContractForm()}
        redirectPath={this.state.redirectPath}
        cancelPath={Path.dirname(this.props.match.url)}
        status={this.props.methodStatus.Submit}
        OnSubmit={this.HandleSubmit}
      />
    );
  }
}

ContractForm.propTypes = {
  contract: PropTypes.object,
  contracts: PropTypes.object.isRequired,
  contractData: PropTypes.object,
  createForm: PropTypes.bool.isRequired,
  contractName: PropTypes.string,
  methods: PropTypes.shape({
    Submit: PropTypes.func.isRequired
  })
};

export default ContractForm;
