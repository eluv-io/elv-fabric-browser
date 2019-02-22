import React from "react";
import {LabelledField} from "../../../components/LabelledField";

import PropTypes from "prop-types";
import {Bytes32ToUtf8} from "../../../../utils/Helpers";
import EventCard from "../../../components/EventCard";
import Form from "../../../forms/Form";

class DeployedContractMethodForm extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      contractMethods: this.props.contract.abi.filter(element => element.type === "function")
    };

    this.SetMethodInterface = this.SetMethodInterface.bind(this);
    this.HandleSubmit = this.HandleSubmit.bind(this);
    this.HandleMethodChange = this.HandleMethodChange.bind(this);
    this.HandleInputChange = this.HandleInputChange.bind(this);
    this.HandleComplete = this.HandleComplete.bind(this);
  }

  SetMethodInterface(methodName) {
    let methodInterface = this.state.contractMethods.find(method => method.name === methodName);

    if(!methodInterface) { return; }

    let inputState = {
      "__funds": 0
    };
    methodInterface.inputs = methodInterface.inputs.map((input, index) => {
      // Give arguments a default name if they don't have one;
      if(!input.name) { input.name =  "Argument " + index; }
      inputState[input.name] = "";
      return input;
    });

    // Ensure state is initialized so react doesn't complain about uncontrolled inputs
    this.setState({
      methodInterface,
      inputs: inputState
    });
  }

  HandleMethodChange(event) {
    this.setState({
      method: event.target.value,
      methodResults: undefined,
      transactionResults: undefined
    });

    this.SetMethodInterface(event.target.value);
  }

  HandleInputChange(event) {
    const value = event.target.type === "checkbox" ? event.target.checked : event.target.value;
    this.setState({
      inputs: {
        ...this.state.inputs,
        [event.target.name]: value
      }
    });
  }

  async HandleSubmit() {
    if(!this.state.method) { return; }

    // Determine funds and remove from inputs, if present
    let inputs = { ...this.state.inputs };

    const funds = inputs.__funds || 0;
    delete inputs.__funds;

    const methodArgs = Object.values(inputs);

    await this.props.methods.CallContractMethod({
      contractAddress: this.props.contract.address,
      abi: this.props.contract.abi,
      methodName: this.state.method,
      methodArgs,
      value: funds
    });

    await this.props.methods.GetContractBalance({
      contractAddress: this.props.contract.address
    });
  }

  HandleComplete() {
    const contractState = this.props.deployedContract;

    // Ensure results are set
    if(!contractState || !contractState.methodResults || contractState.methodResults[this.state.method] === undefined) {
      return;
    }

    if(this.state.methodInterface.constant) {
      // Constant method called - format output with names from interface (if available)
      const outputInterface = this.state.methodInterface.outputs;

      let results = contractState.methodResults[this.state.method];

      if(!Array.isArray(results)) {
        results = [results];
      }

      const displayResults = results.map((result, index) => {
        if(result._hex) {
          result = `${parseInt(result._hex, 16)} (${result._hex})`;
        } else if(outputInterface[index].type === "bytes32") {
          result = Bytes32ToUtf8(result);
        } else {
          result = result.toString();
        }

        return [outputInterface[index].name || `Output ${index}`, result];
      });

      this.setState({
        methodResults: displayResults
      });
    } else {
      // Transaction - display event info
      let results = contractState.methodResults[this.state.method];
      if(!Array.isArray(results)) { results = [results]; }

      this.setState({
        transactionResults: results
      });
    }
  }

  ContractMethodSelection() {
    // Collect and sort methods
    const constantMethods = this.state.contractMethods.filter(element => element.constant).sort((a, b) => a.name > b.name);
    const transactions = this.state.contractMethods.filter(element => !element.constant).sort((a, b) => a.name > b.name);

    // Create lists of options
    let constantOptions = constantMethods.map(method => {
      return <option key={"method-option-" + method.name} value={method.name}>{method.name}</option>;
    });

    let transactionOptions = transactions.map(method => {
      return <option key={"method-option-" + method.name} value={method.name}>{method.name}</option>;
    });

    // Add preceding labels
    constantOptions.unshift(
      <option disabled={true} key="method-option-constant-label">CONSTANTS</option>
    );

    transactionOptions.unshift(
      <option disabled={true} key="method-option-transaction-label">TRANSACTIONS</option>
    );

    // Collect into single list and add initial "unselected" option
    const allOptions = [<option key="method-option-select-prompt" value="">[Select a Method]</option>]
      .concat(constantOptions.concat(transactionOptions));

    return (
      <select name="method" value={this.state.method} onChange={this.HandleMethodChange}>
        { allOptions }
      </select>
    );
  }

  ContractMethodForm() {
    let formInputs, methodType, fundsInput;

    if(this.state.methodInterface) {
      formInputs = this.state.methodInterface.inputs.map(input => {
        const type = input.type;
        const inputType = type === "bool" ? "checkbox" : "text";

        return (
          <div className="labelled-input" key={"input-" + input.name}>
            <label htmlFor={input.name}>{input.name}</label>
            <input
              name={input.name}
              value={this.state.inputs[input.name]}
              type={inputType}
              placeholder={type}
              maxLength={256}
              onChange={this.HandleInputChange}
            />
          </div>
        );
      });

      methodType = (
        <div className="labelled-input">
          <label>Type</label>
          <div className="form-text">{this.state.methodInterface.constant ? "Constant" : "Transaction"}</div>
        </div>
      );

      if(this.state.methodInterface.payable) {
        fundsInput = (
          <div className="labelled-input">
            <label htmlFor="__funds">Funds</label>
            <input type="number" step={0.0000000001} name="__funds" value={this.state.inputs["__funds"]} onChange={this.HandleInputChange} />
          </div>
        );
      }
    }

    return (
      <div className="form-contents">
        <div className="labelled-input">
          <label>Method</label>
          <div className="form-text">{this.ContractMethodSelection()}</div>
        </div>
        { methodType }
        { fundsInput }
        { formInputs }
      </div>
    );
  }

  MethodResults() {
    if(this.state.methodResults) {
      const results = this.state.methodResults.map(result => {
        return <LabelledField key={"result-" + result[0]} label={result[0]} value={result[1]}/>;
      });

      return (
        <div className="label-box">
          <h3>Result: </h3>
          { results }
        </div>
      );
    } else if(this.state.transactionResults) {
      return (
        <div className="label-box">
          <h3>Result: </h3>
          <EventCard events={this.state.transactionResults} />
        </div>
      );
    }
  }

  render() {
    return (
      <div className="contract-method-form">
        <Form
          legend="Call Contract Method"
          formContent={this.ContractMethodForm()}
          noRedirect={true}
          status={this.props.methodStatus.CallContractMethod}
          OnSubmit={this.HandleSubmit}
          OnComplete={this.HandleComplete}
        />
        { this.MethodResults() }
      </div>
    );
  }
}

DeployedContractMethodForm.propTypes = {
  contract: PropTypes.object.isRequired,
  deployedContract: PropTypes.object.isRequired,
  methods: PropTypes.shape({
    CallContractMethod: PropTypes.func.isRequired,
    GetContractBalance: PropTypes.func.isRequired
  })
};

export default DeployedContractMethodForm;
