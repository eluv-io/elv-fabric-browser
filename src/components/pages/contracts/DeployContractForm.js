import React from "react";
import Path from "path";
import RequestForm from "../../forms/RequestForm";
import RequestPage from "../RequestPage";
import Link from "react-router-dom/es/Link";
import { FormatAddress } from "../../../utils/Helpers";
import {PageHeader} from "../../components/Page";

class DeployContractForm extends React.Component {
  constructor(props) {
    super(props);

    const selectedContractParam = this.props.match.params.contractName;

    this.state = {
      libraryId: this.props.libraryId || this.props.match.params.libraryId,
      objectId: this.props.match.params.objectId,
      name: "",
      description: "",
      // If object ID exists in route, this form is for deploying a custom content object contract
      isContentObjectContract: !!(this.props.match.params.objectId),
      selectedContract: selectedContractParam,
      selectedContractParam,
      loadRequestId: undefined,
      submitRequestId: undefined
    };

    this.PageContent = this.PageContent.bind(this);
    this.RequestComplete = this.RequestComplete.bind(this);
    this.HandleInputChange = this.HandleInputChange.bind(this);
    this.HandleContractChange = this.HandleContractChange.bind(this);
    this.HandleConstructorInputChange = this.HandleConstructorInputChange.bind(this);
    this.HandleSubmit = this.HandleSubmit.bind(this);
  }

  componentDidMount() {
    // Load available contracts
    this.setState({
      loadRequestId: this.props.WrapRequest({
        todo: async () => {
          await this.props.ListContracts();
        }
      })
    });
  }

  RequestComplete() {
    if(Object.keys(this.props.contracts).length === 0) { return; }

    // Initialize selected contract to be the first contract in the list if not present
    const contract = this.state.selectedContract || Object.keys(this.props.contracts)[0];

    this.setState({
      selectedContract: contract
    }, () => this.HandleContractChange({target: { value: contract }}));
  }

  HandleInputChange(event) {
    this.setState({
      [event.target.name]: event.target.value
    });
  }

  // When selected contract is changed, find the constructor description in the ABI
  // and reset the constructor input state
  HandleContractChange(event) {
    if(!this.props.contracts) { return null; }

    const contractName = event.target.value;
    const contractAbi = this.props.contracts[contractName].abi;

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
    const contract = this.props.contracts[this.state.selectedContract];

    if(this.state.isContentObjectContract) {
      // Deploy custom content object contract
      this.setState({
        submitRequestId: this.props.WrapRequest({
          todo: async () => {
            await this.props.DeployContentContract({
              libraryId: this.state.libraryId,
              objectId: this.state.objectId,
              contractName: this.state.selectedContract,
              contractDescription: contract.description,
              abi: contract.abi,
              bytecode: contract.bytecode,
              inputs: this.ConstructorInput()
            });
          }
        })
      });
    } else {
      // Deploy generic contract
      this.setState({
        submitRequestId: this.props.WrapRequest({
          todo: async () => {
            const contractAddress = await this.props.DeployContract({
              contractName: this.state.name,
              contractDescription: this.state.description,
              abi: contract.abi,
              bytecode: contract.bytecode,
              inputs: this.ConstructorInput()
            });

            this.setState({contractAddress});
          }
        })
      });
    }
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
    const options = Object.keys(this.props.contracts).map(contractName => {
      return <option key={contractName} value={contractName}>{contractName}</option>;
    });

    return (
      <select
        name="selectedContract"
        onChange={this.HandleContractChange}
        value={this.state.selectedContract}
        disabled={this.state.selectedContractParam}
      >
        { options }
      </select>
    );
  }

  // Name and description when deploying arbitrary (non-content-object) contracts
  ContractInfoFields() {
    if(this.state.isContentObjectContract) { return null; }

    return (
      <div className="contracts-form-data">
        <div className="labelled-input">
          <label className="label" htmlFor="name">Name</label>
          <input name="name" value={this.state.name} onChange={this.HandleInputChange} />
        </div>
        <div className="labelled-input">
          <label className="textarea-label" htmlFor="description">Description</label>
          <textarea name="description" value={this.state.description} onChange={this.HandleInputChange} />
        </div>
      </div>
    );
  }

  ContractFileForm() {
    return (
      <div className="contracts-form-data">
        { this.ContractInfoFields() }
        <div className="labelled-input">
          <label className="label" htmlFor="selectedContract">Contract</label>
          { this.AvailableContracts() }
        </div>
        <div className="labelled-input">
          <label className="label text-label" htmlFor="selectedContractDescription" />
          <div className="form-text">{this.props.contracts[this.state.selectedContract].description}</div>
        </div>
        { this.ConstructorForm() }
      </div>
    );
  }

  PageContent() {
    if(Object.keys(this.props.contracts).length === 0){
      return (
        <div className="page-container">
          <div className="actions-container">
            <Link className="action secondary" to={Path.dirname(this.props.match.url)}>Back</Link>
          </div>
          <PageHeader header="No custom contracts available" />
        </div>
      );
    }
    const legend = this.state.isContentObjectContract ?
      "Set Custom Contract" : "Deploy Custom Contract";

    let redirectPath = Path.dirname(this.props.match.url);

    // Go back one extra path if deploying specific contract
    if(this.state.selectedContractParam) { redirectPath = Path.dirname(redirectPath); }

    if(this.state.contractAddress) {
      // Contract address won't exist until submission
      redirectPath = Path.join(redirectPath, "deployed", FormatAddress(this.state.contractAddress));
    }

    return (
      <RequestForm
        requests={this.props.requests}
        requestId={this.state.submitRequestId}
        legend={legend}
        formContent={this.ContractFileForm()}
        redirectPath={redirectPath}
        cancelPath={Path.dirname(this.props.match.url)}
        OnSubmit={this.HandleSubmit}
      />
    );
  }

  render() {
    // Load available contracts
    return (
      <RequestPage
        requestId={this.state.loadRequestId}
        requests={this.props.requests}
        pageContent={this.PageContent}
        OnRequestComplete={this.RequestComplete}
      />
    );
  }
}

export default DeployContractForm;
