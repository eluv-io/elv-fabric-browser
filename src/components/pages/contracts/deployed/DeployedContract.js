import React from "react";
import { Link } from "react-router-dom";
import Path from "path";

import RequestPage from "../../RequestPage";
import {LabelledField} from "../../../components/LabelledField";
import ClippedText from "../../../components/ClippedText";

import BaseContentContract from "elv-client-js/src/contracts/BaseContent";
import BaseContentTypeContract from "elv-client-js/src/contracts/BaseContentType";
import Fabric from "../../../../clients/Fabric";

class DeployedContract extends React.Component {
  constructor(props) {
    super(props);

    const libraryId = this.props.libraryId || this.props.match.params.libraryId;

    this.state = {
      libraryId,
      objectId: this.props.match.params.objectId,
      contractAddress: this.props.match.params.contractAddress,
      isContentObjectContract: (!!this.props.match.params.objectId),
      visibleMethods: {},
      isCustom: this.props.location.pathname.endsWith("custom-contract"),
      isContentType: Fabric.utils.EqualHash(Fabric.contentSpaceId, libraryId)
    };

    this.PageContent = this.PageContent.bind(this);
    this.RequestComplete = this.RequestComplete.bind(this);
    this.LoadEvents = this.LoadEvents.bind(this);
  }

  componentDidMount() {
    if(this.state.isContentObjectContract) {
      this.setState({
        loadRequestId: this.props.WrapRequest({
          todo: async () => {
            await this.props.GetContentObject({
              libraryId: this.state.libraryId,
              objectId: this.state.objectId
            });

            // Determine contract address in order to query for balance
            const object = this.props.content.objects[this.state.objectId];
            const contractAddress = this.state.isCustom ? object.meta.customContract.address : object.contractAddress;

            this.setState({
              contract: {address: contractAddress}
            });

            await this.props.GetContractBalance({
              contractAddress
            });
          }
        })
      });
    } else {
      this.setState({
        loadRequestId: this.props.WrapRequest({
          todo: async () => {
            await this.props.ListDeployedContracts();

            await this.props.GetContractBalance({
              contractAddress: this.state.contractAddress
            });
          }
        })
      });
    }
  }

  RequestComplete() {
    if(this.state.isContentObjectContract) {
      const object = this.props.content.objects[this.state.objectId];
      const contractState = this.props.deployedContracts[this.state.contract.address];

      if (this.state.isCustom) {
        this.setState({
          contract: {
            name: object.meta.customContract.name,
            description: object.meta.customContract.description,
            address: object.meta.customContract.address,
            abi: object.meta.customContract.abi,
            balance: contractState.balance
          },
          object
        });
      } else {
        const contractType = this.state.isContentType ? "Base Content Type Contract" : "Base Content Contract";
        const contractAbi = this.state.isContentType ? BaseContentTypeContract.abi : BaseContentContract.abi;

        this.setState({
          contract: {
            name: contractType,
            description: contractType,
            address: Fabric.utils.HashToAddress({hash: this.state.objectId}),
            abi: contractAbi,
            balance: contractState.balance
          },
          object
        });
      }
    } else {
      this.setState({
        contract: this.props.deployedContracts[this.state.contractAddress]
      });
    }
  }

  LoadEvents() {
    if(!this.state.isContentObjectContract || this.state.isCustom) {
      this.setState({
        eventsRequestId: this.props.GetContractEvents({
          objectId: this.state.objectId,
          contractAddress: this.state.contract.address,
          abi: this.state.contract.abi
        })
      });
    } else {
      this.setState({
        eventsRequestId: this.props.GetContractEvents({
          objectId: this.state.objectId
        })
      });
    }
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
    const contractState = this.props.deployedContracts[this.state.contract.address];

    if(!contractState || !contractState.events) { return null; }

    return(
      <pre className="event-log">
        { JSON.stringify(contractState.events, null, 2) }
      </pre>
    );
  }

  AbiInfo() {
    if(!this.state.contract.abi) { return null; }

    const abiDisplayInfo = this.state.visibleMethods["__abi"] ?
      <pre key="abi-content">{JSON.stringify(this.state.contract.abi, null, 2)}</pre> : null;

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
    const description = <ClippedText className="object-description" text={this.state.contract.description} />;

    const contractElements = Object.values(this.state.contract.abi);
    const contractConstructor = contractElements.filter(element => element.type === "constructor");
    const contractEvents = contractElements.filter(element => element.type === "event");
    const contractMethods = contractElements.filter(element => element.type === "function");
    const constantMethods = contractMethods.filter(element => element.constant);
    const dynamicMethods = contractMethods.filter(element => !element.constant);

    let backPath = Path.dirname(this.props.match.url);
    if(!this.state.isContentObjectContract) {
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
            { this.state.isContentObjectContract ? this.state.object.name : "Deployed Contract" }
          </h3>
          <h3>{ this.state.contract.name }</h3>
          <div className="label-box">
            <h3>Contract Info</h3>
            <LabelledField label="Name" value={this.state.contract.name} />
            <LabelledField label="Description" value={description} />
            <LabelledField label="Contract Address" value={this.state.contract.address} />
            <LabelledField label="Balance" value={this.state.contract.balance} />
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

export default DeployedContract;
