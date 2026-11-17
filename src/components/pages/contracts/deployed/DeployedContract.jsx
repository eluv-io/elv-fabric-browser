import React from "react";
import UrlJoin from "url-join";
import Path from "path";
import {LabelledField} from "../../../components/LabelledField";
import {ContractTypes} from "../../../../utils/Contracts";
import {Redirect} from "react-router";
import {PageHeader} from "../../../components/Page";
import {Action, Confirm} from "elv-components-js";
import AsyncComponent from "../../../components/AsyncComponent";
import {observer} from "mobx-react";
import DeployedContractMethodForm from "./DeployedContractMethodForm";
import JSONField from "../../../components/JSONField";
import ToggleSection from "../../../components/ToggleSection";
import ActionsToolbar from "../../../components/ActionsToolbar";

import {contractStore} from "@/stores/index";

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

  Actions = (backPath) => {
    return <ActionsToolbar
      showContentLookup={false}
      actions={[
        {
          label: "Back",
          type: "link",
          path: backPath,
          className: "secondary"
        },
        {
          label: "Transfer Funds",
          type: "link",
          path: UrlJoin(this.props.match.url, "funds")
        },
        {
          label: "Contract Events",
          type: "link",
          path: UrlJoin(this.props.match.url, "events")
        },
        // Allow removal (aka stop watching) deployed custom contract
        {
          label: "Remove Contract",
          type: "button",
          onClick: async() => {
            await Confirm({
              message: "Are you sure you want to stop watching this contract?",
              onConfirm: async () => {
                await contractStore.RemoveDeployedContract({
                  address: contractStore.contractAddress
                });

                this.setState({removed: true});
              }
            });
          },
          dividerAbove: true,
          className: "danger"
        }
      ]}
    />;
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
    if(!contractStore.contract.abi) { return null; }

    const abiDisplayInfo = this.state.visibleMethods["__abi"] ?
      <pre key="abi-content">{JSON.stringify(contractStore.contract.abi, null, 2)}</pre> : null;

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
    if([ContractTypes.contentSpace, ContractTypes.library, ContractTypes.unknown].includes(contractStore.contract.type)) {
      backPath = Path.dirname(backPath);
    } else if(contractStore.contract.type === ContractTypes.accessGroup && !this.props.accessGroup) {
      // TODO: this
      // Access group contract, but access group is unknown. Skip access group details page
      backPath = Path.dirname(backPath);
    }

    if(this.state.removed) {
      return <Redirect push to={backPath} />;
    }

    const balance =`φ${Math.round((contractStore.contract.balance || 0) * 1000) / 1000}`;

    return (
      <div className="page-container contracts-page-container">
        { this.Actions(backPath) }
        <PageHeader header={contractStore.contract.name} subHeader={this.props.contractStore.contract.description} />
        <div className="page-content-container">
          <div className="page-content">
            <div className="label-box">
              <h3>Contract Info</h3>
              <LabelledField label="Name">
                { contractStore.contract.name }
              </LabelledField>

              <LabelledField label="Description">
                { contractStore.contract.description }
              </LabelledField>

              <LabelledField label="Contract Address">
                { contractStore.contract.contractAddress }
              </LabelledField>

              <LabelledField label="Balance">
                { balance }
              </LabelledField>

              {
                contractStore.contract.authContext ?
                  (
                    <ToggleSection label="Auth Context">
                      <div className="indented">
                        <JSONField json={contractStore.contract.authContext} />
                      </div>
                    </ToggleSection>
                  ) : null
              }

              { this.AbiInfo() }
              <h3>Contract Methods</h3>
              <DeployedContractMethodForm contract={contractStore.contract} />
            </div>
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
            await contractStore.DeployedContractInfo();
          }
        }
        render={this.PageContent}
      />
    );
  }
}

export default observer(DeployedContract);
