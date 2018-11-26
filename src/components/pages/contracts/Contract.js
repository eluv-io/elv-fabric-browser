import React from "react";
import { Link } from "react-router-dom";
import Path from "path";

import RequestPage from "../RequestPage";
import {LabelledField} from "../../components/LabelledField";
import ClippedText from "../../components/ClippedText";
import Redirect from "react-router/es/Redirect";

class Contract extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      contractName: this.props.match.params.contractName,
      visibleMethods: {}
    };

    this.RequestComplete = this.RequestComplete.bind(this);
    this.DeleteContract = this.DeleteContract.bind(this);
  }

  componentDidMount() {
    this.setState({
      requestId: this.props.ListContracts()
    });
  }

  ToggleElement(methodName) {
    this.setState({
      visibleMethods: {
        ...this.state.visibleMethods,
        [methodName]: !this.state.visibleMethods[methodName]
      }
    });
  }

  ToggleButton(label, id) {
    const toggleVisible = () => this.ToggleElement(id);
    const visible = this.state.visibleMethods[id];
    const toggleButtonText = (visible ? "Hide " : "Show ") + label;

    return (
      <div className="actions-container">
        <button className={"action action-compact action-wide " + (visible ? "" : "secondary")} onClick={toggleVisible}>{ toggleButtonText }</button>
      </div>
    );
  }

  RequestComplete() {
    if(this.state.deleting && this.props.requests[this.state.requestId].completed) {
      this.setState({
        deleted: true
      });
    } else {
      this.setState({
        contract: this.props.contracts.contracts[this.state.contractName]
      });
    }
  }

  DeleteContract(contractName) {
    if (confirm("Are you sure you want to remove this contract?")) {
      this.setState({
        requestId: this.props.RemoveContract({name: contractName}),
        deleting: true
      });

    }
  }

  ContractInfo(info) {
    return info.map(entry => {
      if(!entry.name && entry.type !== "constructor") {
        return null;
      }

      const methodDisplayInfo = this.state.visibleMethods[entry.name] ? <pre>{JSON.stringify(entry, null, 2)}</pre> : null;

      return (
        <div className="indented" key={"contract-method-" + entry.name}>
          <LabelledField label={entry.name} value={this.ToggleButton(entry.type.capitalize() + " Info", entry.name)} wideLabel={true} />
          { methodDisplayInfo }
        </div>
      );
    });
  }

  PageContent() {
    if(!this.state.contract){ return null; }

    if(this.state.deleted) {
      return <Redirect push to={Path.dirname(this.props.match.url)}/>;
    }

    const description = <ClippedText className="object-description" text={this.state.contract.description} />;
    const abiDisplayInfo = this.state.visibleMethods["__abi"] ? <pre>{JSON.stringify(this.state.contract.abi, null, 2)}</pre> : null;
    const bytecodeDisplayInfo = this.state.visibleMethods["__bytecode"] ? <pre>{this.state.contract.bytecode}</pre> : null;

    const contractElements = Object.values(this.state.contract.abi);
    const contractConstructor = contractElements.filter(element => element.type === "constructor");
    const contractEvents = contractElements.filter(element => element.type === "event");
    const contractMethods = contractElements.filter(element => element.type === "function");

    return (
      <div className="page-container contracts-page-container">
        <div className="actions-container">
          <Link to={Path.dirname(this.props.match.url)} className="action secondary" >Back</Link>
          <Link to={Path.join(this.props.match.url, "edit")} className="action" >Edit Contract</Link>
          <button className="action delete-action" onClick={() => this.DeleteContract(this.state.contractName)}>Delete Contract</button>
        </div>
        <div className="object-display">
          <h3 className="page-header">{ this.state.contractName }</h3>
          <div className="label-box">
            <h3>Contract Info</h3>
            <LabelledField label="Description" value={description} />
            <LabelledField label="ABI" value={this.ToggleButton("Full ABI", "__abi")} />
            { abiDisplayInfo }
            <LabelledField label="Bytecode" value={this.ToggleButton("Bytecode", "__bytecode")} />
            { bytecodeDisplayInfo }
            <h3>Constructor</h3>
            { this.ContractInfo(contractConstructor) }
            <h3>Events</h3>
            { this.ContractInfo(contractEvents) }
            <h3>Methods</h3>
            { this.ContractInfo(contractMethods) }
          </div>
        </div>
      </div>
    );
  }

  render() {
    return (
      <RequestPage
        pageContent={this.PageContent()}
        requestId={this.state.requestId}
        requests={this.props.requests}
        OnRequestComplete={this.RequestComplete}
      />
    );
  }
}

export default Contract;
