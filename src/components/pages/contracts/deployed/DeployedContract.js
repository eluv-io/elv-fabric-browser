import React from "react";
import PropTypes from "prop-types";
import Path from "path";
import {LabelledField} from "../../../components/LabelledField";
import {ContractTypes} from "../../../../utils/Contracts";
import Redirect from "react-router/es/Redirect";
import {PageHeader} from "../../../components/Page";
import DeployedContractMethodForm from "./DeployedContractMethodForm";
import Action from "elv-components-js/src/components/Action";
import LoadingElement from "elv-components-js/src/components/LoadingElement";

class DeployedContract extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      visibleMethods: {},
      method: "",
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
    if(this.props.contract.type !== ContractTypes.unknown) { return null; }

    return (
      <Action
        className="delete-action"
        onClick={async () => {
          if(confirm("Are you sure you want to stop watching this contract?")) {
            await this.props.methods.RemoveDeployedContract({address: this.props.contract.address});
          }
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
    if(!this.props.contract.abi) { return null; }

    const abiDisplayInfo = this.state.visibleMethods["__abi"] ?
      <pre key="abi-content">{JSON.stringify(this.props.contract.abi, null, 2)}</pre> : null;

    return [
      <LabelledField
        key="abi-label"
        label="ABI"
        value={this.ToggleButton("ABI", "__abi")}
      />,
      abiDisplayInfo
    ];
  }

  PageContent() {
    let backPath = Path.dirname(this.props.match.url);
    // Some routes require going back one path, others two
    if([ContractTypes.contentSpace, ContractTypes.library, ContractTypes.unknown].includes(this.props.contract.type)) {
      backPath = Path.dirname(backPath);
    } else if(this.props.contract.type === ContractTypes.accessGroup && !this.props.accessGroup) {
      // Access group contract, but access group is unknown. Skip access group details page
      backPath = Path.dirname(backPath);
    }

    const balance =`φ${Math.round((this.props.deployedContract.balance || 0) * 1000) / 1000}`;
    return (
      <div className="page-container contracts-page-container">
        <div className="actions-container">
          <Action type="link" to={backPath} className="secondary" >Back</Action>
          <Action type="link" to={Path.join(this.props.match.url, "funds")}>Transfer Funds</Action>
          <Action type="link" to={Path.join(this.props.match.url, "logs")}>Contract Logs</Action>
          { this.DeleteButton() }
        </div>
        <PageHeader header={this.props.contract.name} subHeader={this.props.contract.description} />
        <div className="page-content">
          <div className="label-box">
            <h3>Contract Info</h3>
            <LabelledField label="Name" value={this.props.contract.name} />
            <LabelledField label="Description" value={this.props.contract.description} />
            <LabelledField label="Contract Address" value={this.props.contract.address} />
            <LabelledField label="Balance" value={balance} />
            { this.AbiInfo() }
            <h3>Contract Methods</h3>
            <DeployedContractMethodForm {...this.props} />
          </div>
        </div>
      </div>
    );
  }

  render() {
    if(this.props.methodStatus.RemoveDeployedContract.completed) {
      return <Redirect push to={Path.dirname(Path.dirname(this.props.match.url))} />;
    }

    return (
      <LoadingElement
        fullPage={true}
        loading={this.props.methodStatus.RemoveDeployedContract.loading}
        render={this.PageContent}
      />
    );
  }
}

DeployedContract.propTypes = {
  contract: PropTypes.object.isRequired,
  deployedContract: PropTypes.object.isRequired,
  libraryId: PropTypes.string,
  library: PropTypes.object,
  objectId: PropTypes.string,
  object: PropTypes.object,
  accessGroup: PropTypes.object,
  methods: PropTypes.shape({
    RemoveDeployedContract: PropTypes.func
  })
};

export default DeployedContract;
