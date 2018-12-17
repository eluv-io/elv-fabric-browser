import React from "react";
import { Link } from "react-router-dom";
import Path from "path";
import {LabelledField} from "../../../components/LabelledField";
import ClippedText from "../../../components/ClippedText";
import PropTypes from "prop-types";
import DeployedContractWrapper from "./DeployedContractWrapper";
import {ContractTypes} from "../../../../utils/Contracts";
import RequestPage from "../../RequestPage";
import Redirect from "react-router/es/Redirect";
import {PageHeader} from "../../../components/Page";

class DeployedContract extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      visibleMethods: {}
    };

    this.LoadEvents = this.LoadEvents.bind(this);
    this.PageContent = this.PageContent.bind(this);
  }

  LoadEvents() {
    this.setState({
      eventsRequestId: this.props.GetContractEvents({
        contractAddress: this.props.contract.address,
        abi: this.props.contract.abi
      })
    });
  }

  // Allow removal (aka stop watching) deployed custom contract
  DeleteButton() {
    if(this.props.contract.type !== ContractTypes.unknown) { return null; }

    return (
      <button
        className="action delete-action"
        onClick={async () => {
          if(confirm("Are you sure you want to stop watching this contract?")) {
            this.setState({
              deleteRequestId: this.props.WrapRequest({
                todo: async () => {
                  await this.props.RemoveDeployedContract({address: this.props.contract.address});

                  this.setState({deleted: true});
                }
              })
            });
          }
        }}
      >
        Remove Contract
      </button>
    );
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

  PageContent() {
    const description = <ClippedText className="object-description" text={this.props.contract.description} />;

    const contractElements = Object.values(this.props.contract.abi);
    const contractConstructor = contractElements.filter(element => element.type === "constructor");
    const contractEvents = contractElements.filter(element => element.type === "event");
    const contractMethods = contractElements.filter(element => element.type === "function");
    const constantMethods = contractMethods.filter(element => element.constant);
    const dynamicMethods = contractMethods.filter(element => !element.constant);

    let backPath = Path.dirname(this.props.match.url);
    // Some routes require going back one path, others two
    if([ContractTypes.contentSpace, ContractTypes.library, ContractTypes.unknown].includes(this.props.contract.type)) {
      backPath = Path.dirname(backPath);
    }

    return (
      <div className="page-container contracts-page-container">
        <div className="actions-container">
          <Link to={backPath} className="action secondary" >Back</Link>
          <Link to={Path.join(this.props.match.url, "funds")} className="action" >Transfer Funds</Link>
          { this.DeleteButton() }
        </div>
        <div className="object-display">
          <PageHeader header={this.props.contract.name} subHeader={this.props.contract.description} />
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

  render() {
    if(this.state.deleted) {
      return <Redirect push to={Path.dirname(Path.dirname(this.props.match.url))} />;
    }

    // Show loading indicator when deleting
    if(this.state.deleteRequestId) {
      return (
        <RequestPage
          requests={this.props.requests}
          requestId={this.state.deleteRequestId}
          pageContent={this.PageContent}
        />
      );
    } else {
      return this.PageContent();
    }
  }
}

DeployedContract.propTypes = {
  contract: PropTypes.object.isRequired
};

export default DeployedContractWrapper(DeployedContract);
