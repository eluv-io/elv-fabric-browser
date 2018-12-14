import React from "react";
import RequestForm from "../../../forms/RequestForm";
import Path from "path";
import {LabelledField} from "../../../components/LabelledField";
import Link from "react-router-dom/es/Link";

import DeployedContractWrapper from "./DeployedContractWrapper";
import PropTypes from "prop-types";
import {Bytes32ToUtf8} from "../../../../utils/Helpers";

class DeployedContractMethodForm extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      method: this.props.match.params.method,
      visibleMethods: {},
    };

    this.SetMethodInterface = this.SetMethodInterface.bind(this);
    this.HandleSubmit = this.HandleSubmit.bind(this);
    this.HandleInputChange = this.HandleInputChange.bind(this);
    this.HandleError = this.HandleError.bind(this);
    this.HandleComplete = this.HandleComplete.bind(this);
  }

  componentDidMount() {
    this.SetMethodInterface();
  }

  SetMethodInterface() {
    let methodInterface = this.props.contract.abi.find(element =>
      element.name === this.state.method && element.type === "function"
    );

    let inputState = {};
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

  HandleInputChange(event) {
    this.setState({
      inputs: {
        ...this.state.inputs,
        [event.target.name]: event.target.value
      }
    });
  }

  HandleSubmit() {
    const methodArgs = Object.values(this.state.inputs);

    this.setState({
      submitRequestId: this.props.WrapRequest({
        todo: async () => {
          await this.props.CallContractMethod({
            contractAddress: this.props.contract.address,
            abi: this.props.contract.abi,
            methodName: this.state.method,
            methodArgs
          });
        }
      })
    });
  }

  HandleError() {
    this.setState({
      submitRequestId: undefined
    });
  }

  HandleComplete() {
    if(this.state.methodInterface.constant) {
      const outputInterface = this.state.methodInterface.outputs;
      const contractState = this.props.deployedContracts[this.props.contract.address];

      // Ensure results are set
      if(!contractState || !contractState.methodResults || !contractState.methodResults[this.state.method]) {
        return;
      }

      let results = contractState.methodResults[this.state.method];

      if(!Array.isArray(results)) {
        results = [results];
      }

      const displayResults = results.map((result, index) => {
        if(result._hex) {
          result = `${parseInt(result._hex, 16)} (${result._hex})`;
        } else if(outputInterface[index].type === "bytes32") {
          result = Bytes32ToUtf8(result);
        }

        return [outputInterface[index].name || `Output ${index}`, result];
      });

      this.setState({
        methodResults: displayResults
      });
    }
  }

  ContractMethodForm() {
    return this.state.methodInterface.inputs.map(input => {
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
  }

  MethodResults() {
    if(!this.state.methodResults) { return null; }

    const results = this.state.methodResults.map(result => {
      return <LabelledField key={"result-" + result[0]} label={result[0]} value={result[1]}/>;
    });

    return (
      <div className="label-box">
        <h3>Results: </h3>
        { results }
      </div>
    );
  }

  render() {
    // Method Interface may not be set immediately - ensure it is set before rendering
    if(!this.state.methodInterface) { return null; }

    // Don't redirect after calling constant method
    const backPath = Path.dirname(Path.dirname(this.props.match.url));
    const redirectPath = this.state.methodInterface.constant ? undefined : backPath;

    return (
      <div className="page-container">
        <div className="actions-container">
          <Link className="action secondary" to={backPath}>Back</Link>
        </div>
        <h3 className="page-header">
          { this.props.contract.description }
        </h3>
        <div className="label-box">
          <LabelledField label="Contract" value={this.props.contract.name} />
          <LabelledField label="Method" value={this.state.method} />
        </div>
        <RequestForm
          requests={this.props.requests}
          requestId={this.state.submitRequestId}
          legend="Call Contract Method"
          formContent={this.ContractMethodForm()}
          redirectPath={redirectPath}
          cancelPath={backPath}
          OnSubmit={this.HandleSubmit}
          OnComplete={this.HandleComplete}
          OnError={this.HandleError}
        />
        { this.MethodResults() }
      </div>
    );
  }
}

DeployedContractMethodForm.propTypes = {
  contract: PropTypes.object.isRequired
};

export default DeployedContractWrapper(DeployedContractMethodForm);
