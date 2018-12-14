import React from "react";
import { Link } from "react-router-dom";
import Path from "path";
import {LabelledField} from "../../../components/LabelledField";
import ClippedText from "../../../components/ClippedText";
import PropTypes from "prop-types";
import DeployedContractWrapper from "./DeployedContractWrapper";
import {ContractTypes} from "../../../../utils/Contracts";

class DeployedContract extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      visibleMethods: {}
    };

    this.LoadEvents = this.LoadEvents.bind(this);
  }

  LoadEvents() {
    this.setState({
      eventsRequestId: this.props.GetContractEvents({
        contractAddress: this.props.contract.address,
        abi: this.props.contract.abi
      })
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
      <button
        key={"toggle-" + label}
        className={"action action-compact action-wide " + (visible ? "" : "secondary")}
        onClick={toggleVisible}>
        { toggleButtonText }
      </button>
    );
  }

  ContractInfo(info) {
    return info.sort((a, b) => a.name > b.name).map(entry => {
      if(!entry.name && entry.type !== "constructor") {
        return null;
      }

      const methodDisplayInfo = this.state.visibleMethods[entry.name] ? <pre>{JSON.stringify(entry, null, 2)}</pre> : null;

      const toggleButton = this.ToggleButton("Interface", entry.name);

      // Add link to call contract method
      let callButton;
      if(entry.type === "function") {
        callButton =
          <Link
            className="action action-compact action-wide action-inline"
            key={"call-" + entry.name}
            to={Path.join(this.props.match.url, "call", entry.name)}
          >
            Call Method
          </Link>;
      }

      return (
        <div className="indented" key={"contract-method-" + entry.name}>
          <LabelledField
            label={entry.name}
            value={
              <div className="actions-container">
                { callButton }
                { toggleButton }
              </div>
            }
            wideLabel={true}
          />
          { methodDisplayInfo }
        </div>
      );
    });
  }

  ContractEvents() {
    const contractState = this.props.deployedContracts[this.props.contract.address];

    if(!contractState || !contractState.events) { return null; }

    return(
      <pre className="event-log">
        { JSON.stringify(contractState.events, null, 2) }
      </pre>
    );
  }

  AbiInfo() {
    if(!this.props.contract.abi) { return null; }

    const abiDisplayInfo = this.state.visibleMethods["__abi"] ?
      <pre key="abi-content">{JSON.stringify(this.props.contract.abi, null, 2)}</pre> : null;

    return [
      <LabelledField
        key="abi-label"
        label="ABI"
        value={
          <div className="actions-container">
            { this.ToggleButton("ABI", "__abi") }
          </div>
        }
      />,
      abiDisplayInfo
    ];
  }

  render() {
    const description = <ClippedText className="object-description" text={this.props.contract.description} />;

    const contractElements = Object.values(this.props.contract.abi);
    const contractConstructor = contractElements.filter(element => element.type === "constructor");
    const contractEvents = contractElements.filter(element => element.type === "event");
    const contractMethods = contractElements.filter(element => element.type === "function");
    const constantMethods = contractMethods.filter(element => element.constant);
    const dynamicMethods = contractMethods.filter(element => !element.constant);

    let backPath = Path.dirname(this.props.match.url);
    // Library contract is on library object - go back 2 to get back to library
    if([ContractTypes.contentSpace, ContractTypes.library].includes(this.props.contract.type)) {
      backPath = Path.dirname(backPath);
    }

    return (
      <div className="page-container contracts-page-container">
        <div className="actions-container">
          <Link to={backPath} className="action secondary" >Back</Link>
          <Link to={Path.join(this.props.match.url, "funds")} className="action" >Transfer Funds</Link>
        </div>
        <div className="object-display">
          <h3 className="page-header">
            { this.props.contract.name }
          </h3>
          <h3>{ this.props.contract.description }</h3>
          <div className="label-box">
            <h3>Contract Info</h3>
            <LabelledField label="Name" value={this.props.contract.name} />
            <LabelledField label="Description" value={description} />
            <LabelledField label="Contract Address" value={this.props.contract.address} />
            <LabelledField label="Balance" value={this.props.contract.balance} />
            { this.AbiInfo() }
            <h3>Events</h3>
            <div className="actions-container">
              <button className="action" onClick={this.LoadEvents}>Load Events</button>
            </div>
            { this.ContractEvents() }
            <h3>Contract Constructor</h3>
            { this.ContractInfo(contractConstructor) }
            <h3>Constant Methods</h3>
            { this.ContractInfo(constantMethods) }
            <h3>Dynamic Methods</h3>
            { this.ContractInfo(dynamicMethods) }
            <h3>Contract Events</h3>
            { this.ContractInfo(contractEvents) }
          </div>
        </div>
      </div>
    );
  }
}

DeployedContract.propTypes = {
  contract: PropTypes.object.isRequired
};

export default DeployedContractWrapper(DeployedContract);
