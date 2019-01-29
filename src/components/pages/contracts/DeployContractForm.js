import React from "react";
import Path from "path";
import RequestForm from "../../forms/RequestForm";
import RequestPage from "../RequestPage";
import { FormatAddress } from "../../../utils/Helpers";
import RadioSelect from "../../components/RadioSelect";

class DeployContractForm extends React.Component {
  constructor(props) {
    super(props);

    const selectedContractParam = this.props.match.params.contractName;

    this.state = {
      libraryId: this.props.libraryId || this.props.match.params.libraryId,
      objectId: this.props.match.params.objectId,
      name: "",
      description: "",
      funds: 0,
      // If object ID exists in route, this form is for deploying a custom content object contract
      isContentObjectContract: !!(this.props.match.params.objectId),
      selectedContract: selectedContractParam,
      fixedContract: !!selectedContractParam,
      contractSource: "saved",
      contracts: {},
      currentContractFunds: 0,
      loadRequestId: undefined,
      submitRequestId: undefined
    };

    this.PageContent = this.PageContent.bind(this);
    this.RequestComplete = this.RequestComplete.bind(this);
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
    // Load available contracts
    this.setState({
      loadRequestId: this.props.WrapRequest({
        todo: async () => {
          await this.props.ListContracts();
          await this.props.ListDeployedContracts();
        }
      })
    });
  }

  RequestComplete() {
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

    if(!selectedContract || !contracts[selectedContract]) {
      this.setState({selectedContract});
    }

    const constructor = contracts[selectedContract].abi.find((method) => {
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
      funds: 0
    });

    if(this.state.contractSource === "deployed") {
      this.props.GetContractBalance({contractAddress: contracts[selectedContract].address});
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

  HandleSubmit() {
    const contract = this.Contracts()[this.state.selectedContract];

    if(this.state.isContentObjectContract) {
      // Deploy custom content object contract
      this.setState({
        submitRequestId: this.props.WrapRequest({
          todo: async () => {
            await this.props.SetCustomContentContract({
              libraryId: this.state.libraryId,
              objectId: this.state.objectId,
              contractName: this.state.selectedContract,
              contractDescription: contract.description,
              address: contract.address,
              abi: contract.abi,
              bytecode: contract.bytecode,
              inputs: this.ConstructorInput(),
              funds: this.state.funds
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
              inputs: this.ConstructorInput(),
              funds: this.state.funds
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
          <input name="funds" type="number" step={"0.00000001"} onChange={this.HandleInputChange} />
        </div>
      </div>
    );
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
    return (
      <div className="contracts-form-data">
        { this.ContractSourceSelection() }
        { this.ContractSelection() }
        { this.ContractInfoFields() }
        <div className="labelled-input">
          <label className="label text-label" htmlFor="selectedContractDescription" />
          <div className="form-text">{selectedContract.description}</div>
        </div>
        { this.ConstructorForm() }
        { this.ContractFunds(selectedContract.balance) }
      </div>
    );
  }

  PageContent() {
    const legend = this.state.isContentObjectContract ?
      "Set Custom Contract" : "Deploy Custom Contract";

    let redirectPath = Path.dirname(this.props.match.url);

    // Go back one extra path if deploying specific contract
    if(this.state.fixedContract) { redirectPath = Path.dirname(redirectPath); }

    if(this.state.contractAddress) {
      // Contract address won't exist until submission
      redirectPath = Path.join(redirectPath, "deployed", FormatAddress(this.state.contractAddress));
    }

    return (
      <RequestForm
        requests={this.props.requests}
        requestId={this.state.submitRequestId}
        legend={legend}
        formContent={this.ContractForm()}
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
