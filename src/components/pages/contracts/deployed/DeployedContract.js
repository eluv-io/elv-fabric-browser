import React from "react";
import UrlJoin from "url-join";
import Path from "path";
import {LabelledField} from "../../../components/LabelledField";
import {ContractTypes} from "../../../../utils/Contracts";
import Redirect from "react-router/es/Redirect";
import {PageHeader} from "../../../components/Page";
import {Action, AsyncComponent, Confirm} from "elv-components-js";
import {inject, observer} from "mobx-react";
import DeployedContractMethodForm from "./DeployedContractMethodForm";

@inject("contractStore")
@observer
class DeployedContract extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      visibleMethods: {},
      method: "",
      removed: false
    };

    this.PageContent = this.PageContent.bind(this);
    this.HandleInputChange = this.HandleInputChange.bind(this);
  }

  HandleInputChange(event) {
    this.setState({
      [event.target.name]: event.target.value
    });
  }

  // Allow removal (aka stop watching) deployed custom contract
  DeleteButton() {
    if(this.state.contract.type !== ContractTypes.unknown) { return null; }

    return (
      <Action
        className="danger"
        onClick={async () => {
          await Confirm({
            message: "Are you sure you want to stop watching this contract?",
            onConfirm: async () => {
              await this.props.contractStore.RemoveDeployedContract({
                address: this.state.contract.contractAddress
              });

              this.setState({removed: true});
            }
          });
        }}
      >
        Remove Contract
      </Action>
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
      <Action
        key={"toggle-" + label}
        className={visible ? "" : "secondary"}
        onClick={toggleVisible}>
        { toggleButtonText }
      </Action>
    );
  }

  AbiInfo() {
    if(!this.state.contract.abi) { return null; }

    const abiDisplayInfo = this.state.visibleMethods["__abi"] ?
      <pre key="abi-content">{JSON.stringify(this.state.contract.abi, null, 2)}</pre> : null;

    return [
      <LabelledField key="abi-label" label="ABI">
        { this.ToggleButton("ABI", "__abi") }
      </LabelledField>,
      abiDisplayInfo
    ];
  }

  PageContent() {
    let backPath = Path.dirname(this.props.match.url);
    // Some routes require going back one path, others two
    if([ContractTypes.contentSpace, ContractTypes.library, ContractTypes.unknown].includes(this.state.contract.type)) {
      backPath = Path.dirname(backPath);
    } else if(this.state.contract.type === ContractTypes.accessGroup && !this.props.accessGroup) {
      // TODO: this
      // Access group contract, but access group is unknown. Skip access group details page
      backPath = Path.dirname(backPath);
    }

    if(this.state.removed) {
      return <Redirect push to={backPath} />;
    }

    const balance =`φ${Math.round((this.state.contract.balance || 0) * 1000) / 1000}`;

    // TODO: ADD THIS BACK
    //
    return (
      <div className="page-container contracts-page-container">
        <div className="actions-container">
          <Action type="link" to={backPath} className="secondary" >Back</Action>
          <Action type="link" to={UrlJoin(this.props.match.url, "funds")}>Transfer Funds</Action>
          <Action type="link" to={UrlJoin(this.props.match.url, "events")}>Contract Events</Action>
          { this.DeleteButton() }
        </div>
        <PageHeader header={this.state.contract.name} subHeader={this.state.contract.description} />
        <div className="page-content">
          <div className="label-box">
            <h3>Contract Info</h3>
            <LabelledField label="Name">
              { this.state.contract.name }
            </LabelledField>

            <LabelledField label="Description">
              { this.state.contract.description }
            </LabelledField>

            <LabelledField label="Contract Address">
              { this.state.contract.contractAddress }
            </LabelledField>

            <LabelledField label="Balance">
              { balance }
            </LabelledField>

            { this.AbiInfo() }
            <h3>Contract Methods</h3>
            <DeployedContractMethodForm contract={this.state.contract} />
          </div>
        </div>
      </div>
    );
  }

  render() {
    return (
      <AsyncComponent
        Load={
          async () => {
            this.setState({
              contract: await this.props.contractStore.DeployedContractInfo()
            });
          }
        }
        render={this.PageContent}
      />
    );
  }
}

export default DeployedContract;
