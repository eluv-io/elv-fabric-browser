import React from "react";
import PropTypes from "prop-types";
import Path from "path";
import { FormatAddress } from "../../../utils/Helpers";
import RadioSelect from "../../components/RadioSelect";
import Fabric from "../../../clients/Fabric";
import {JsonTextArea} from "../../../utils/Input";
import Form from "../../forms/Form";

class DeployContractForm extends React.Component {
  constructor(props) {
    super(props);

    const selectedContractParam = this.props.match.params.contractName;
    const isContentTypeContract = Fabric.contentSpaceLibraryId === props.libraryId;

    this.state = {
      name: "",
      description: "",
      funds: 0,
      // If object ID exists in route, this form is for deploying a custom content object contract
      isContentObjectContract: !!(this.props.objectId),
      isContentTypeContract,
      selectedContract: selectedContractParam,
      fixedContract: !!selectedContractParam,
      contractSource: "saved",
      contracts: {},
      currentContractFunds: 0,
      loadRequestId: undefined,
      submitRequestId: undefined
    };

    this.HandleInputChange = this.HandleInputChange.bind(this);
    this.HandleContractChange = this.HandleContractChange.bind(this);
    this.HandleContractSourceChange = this.HandleContractSourceChange.bind(this);
    this.HandleConstructorInputChange = this.HandleConstructorInputChange.bind(this);
    this.HandleSubmit = this.HandleSubmit.bind(this);
  }

  Contracts() {
    return this.state.contractSource === "saved" ? this.props.contracts : this.props.deployedContracts;
  }

  componentDidMount() {
    let selectedContract = this.state.selectedContract;
    let contractSource = "saved";
    if(!selectedContract) {
      if(Object.keys(this.props.contracts).length > 0) {
        // Initialize selected contract to be the first saved contract
        selectedContract = Object.keys(this.props.contracts)[0];
      } else if(Object.keys(this.props.deployedContracts).length > 0) {
        // Initialize selected contract to be the first deployed contract
        selectedContract = Object.keys(this.props.deployedContracts)[0];
        contractSource = "deployed";
      }
    }

    this.setState({
      selectedContract,
      contractSource,
    }, () => this.HandleContractChange());
  }

  HandleInputChange(event) {
    this.setState({
      [event.target.name]: event.target.value
    });
  }

  HandleContractSourceChange(event) {
    this.setState({
      contractSource: event.target.value,
      selectedContract: undefined,
    }, () => this.HandleContractChange());
  }

  // When selected contract is changed, find the constructor description in the ABI
  // and reset the constructor input state
  HandleContractChange(event) {
    const contracts = this.Contracts();
    const selectedContract = (event && event.target.value) || this.state.selectedContract || Object.keys(contracts)[0];
    const contract = contracts[selectedContract];

    if(!selectedContract || !contract) {
      this.setState({selectedContract});
      return;
    }

    const constructor = contract.abi.find((method) => {
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
      selectedContract,
      constructorInputs,
      constructor,
      factoryAbi: "",
      funds: 0
    });

    if(this.state.contractSource === "deployed") {
      this.props.GetContractBalance({contractAddress: contract.address});
    }
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

  async HandleSubmit() {
    const contract = this.Contracts()[this.state.selectedContract];

    let contractAddress;
    if(this.state.isContentObjectContract) {
      contractAddress = await this.props.methods.SetCustomContentContract({
        libraryId: this.props.libraryId,
        objectId: this.props.objectId,
        contractName: this.state.selectedContract,
        contractDescription: contract.description,
        address: contract.address,
        abi: contract.abi,
        factoryAbi: this.state.factoryAbi,
        bytecode: contract.bytecode,
        inputs: this.ConstructorInput(),
        funds: this.state.funds
      });
    } else {
      contractAddress = await this.props.methods.DeployContract({
        contractName: this.state.name,
        contractDescription: this.state.description,
        abi: contract.abi,
        bytecode: contract.bytecode,
        inputs: this.ConstructorInput(),
        funds: this.state.funds
      });
    }

    this.setState({contractAddress});
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

  ContractSelection() {
    if(this.state.fixedContract) {
      return (
        <div className="labelled-input">
          <label className="label text-label">Contract</label>
          <div className="form-text">{this.state.selectedContract}</div>
        </div>
      );
    }

    const options = Object.keys(this.Contracts()).map(contractKey => {
      return <option key={contractKey} value={contractKey}>{this.Contracts()[contractKey].name}</option>;
    });

    return (
      <div className="labelled-input">
        <label className="label" htmlFor="selectedContract">Contract</label>
        <select
          name="selectedContract"
          onChange={this.HandleContractChange}
          value={this.state.selectedContract}
          disabled={this.state.fixedContract}
        >
          { options }
        </select>
      </div>
    );
  }

  ContractSourceSelection() {
    if(this.state.fixedContract || !this.state.isContentObjectContract) {
      return null;
    }

    return (
      <RadioSelect
        name="contractSource"
        label="Contract Source"
        options={[
          ["Saved", "saved"],
          ["Deployed", "deployed"]
        ]}
        inline={true}
        selected={this.state.contractSource}
        onChange={this.HandleContractSourceChange}
      />
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

  ContractFunds(balance) {
    let currentFunds;
    let label = "Funds";
    if(this.state.contractSource === "deployed") {
      label = "Additional Funds";
      currentFunds = (
        <div className="labelled-input">
          <label className="label text-label">Current Balance</label>
          <div className="form-text">{balance}</div>
        </div>
      );
    }

    return (
      <div>
        { currentFunds }
        <div className="labelled-input">
          <label htmlFor="funds">{label}</label>
          <input name="funds" value={this.state.funds} type="number" step={"0.00000001"} onChange={this.HandleInputChange} />
        </div>
      </div>
    );
  }

  // Request ABI for content type factory contracts
  FactoryAbi() {
    if(this.state.isContentTypeContract) {
      return (
        <div>
          <div className="labelled-input">
            <label className="label text-label">Factory ABI</label>
            <div className="form-text">
              If this contract is a factory, specify the ABI of the contract that will be applied to the content objects of this type
            </div>
          </div>
          <div className="labelled-input">
            <label className="textarea-label" htmlFor="factoryAbi" />
            <JsonTextArea
              name="factoryAbi"
              value={this.state.factoryAbi}
              onChange={this.HandleInputChange}
              UpdateValue={formattedAbi => this.setState({factoryAbi: formattedAbi})}
            />
          </div>
        </div>
      );
    }
  }

  ContractForm() {
    if(Object.keys(this.Contracts()).length === 0) {
      return (
        <div>
          {this.ContractSourceSelection()}
          <div className="labelled-input">
            <label className="label text-label"/>
            <div className="form-text">{`No ${this.state.contractSource} contracts available`}</div>
          </div>
        </div>
      );
    }

    const selectedContract = this.Contracts()[this.state.selectedContract] || {};

    let contractDescription;
    if(selectedContract.description) {
      contractDescription = (
        <div className="labelled-input">
          <label className="label text-label" htmlFor="selectedContractDescription" />
          <div className="form-text">{selectedContract.description}</div>
        </div>
      );
    }

    return (
      <div className="contracts-form-data">
        { this.ContractSourceSelection() }
        { this.ContractSelection() }
        { this.FactoryAbi() }
        { this.ContractInfoFields() }
        { contractDescription }
        { this.ConstructorForm() }
        { this.ContractFunds(selectedContract.balance) }
      </div>
    );
  }

  render() {
    const legend = this.state.isContentObjectContract ?
      "Set Custom Contract" : "Deploy Custom Contract";

    let redirectPath = Path.dirname(this.props.match.url);

    // Go back one extra path if deploying specific contract
    if(this.state.fixedContract) { redirectPath = Path.dirname(redirectPath); }

    if(!this.state.isContentObjectContract && this.state.contractAddress) {
      // Contract address won't exist until submission
      redirectPath = Path.join(redirectPath, "deployed", FormatAddress(this.state.contractAddress));
    }

    const status = this.state.isContentObjectContract ?
      this.props.methodStatus.SetCustomContentContract : this.props.methodStatus.DeployContract;

    return (
      <Form
        legend={legend}
        formContent={this.ContractForm()}
        redirectPath={redirectPath}
        cancelPath={Path.dirname(this.props.match.url)}
        OnSubmit={this.HandleSubmit}
        submitting={status.loading}
        redirect={status.completed && this.state.contractAddress}
      />
    );
  }
}

DeployContractForm.propTypes = {
  libraryId: PropTypes.string,
  objectId: PropTypes.string,
  contractName: PropTypes.string,
  contracts: PropTypes.object.isRequired,
  deployedContracts: PropTypes.object.isRequired,
  GetContractBalance: PropTypes.func.isRequired,
  methods: PropTypes.shape({
    DeployContract: PropTypes.func.isRequired,
    SetCustomContentContract: PropTypes.func.isRequired
  })
};

export default DeployContractForm;
