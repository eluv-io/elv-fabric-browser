import React from "react";
import PropTypes from "prop-types";
import UrlJoin from "url-join";
import Path from "path";
import {LabelledField} from "../../components/LabelledField";
import ClippedText from "../../components/ClippedText";
import Redirect from "react-router/es/Redirect";
import {PageHeader} from "../../components/Page";
import {Action, Confirm, LoadingElement} from "elv-components-js";

class Contract extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      visibleMethods: {}
    };

    this.PageContent = this.PageContent.bind(this);
    this.DeleteContract = this.DeleteContract.bind(this);
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
      <Action className={visible ? "" : "secondary"} onClick={toggleVisible}>
        { toggleButtonText }
      </Action>
    );
  }

  async DeleteContract() {
    await Confirm({
      message: "Are you sure you want to remove this contract?",
      onConfirm: async () => await this.props.methods.RemoveContract({name: this.props.contractName})
    });
  }

  ContractInfo(info) {
    return info.map(entry => {
      if(!entry.name && entry.type !== "constructor") {
        return null;
      }

      const methodDisplayInfo = this.state.visibleMethods[entry.name] ? <pre>{JSON.stringify(entry, null, 2)}</pre> : null;

      return (
        <div className="indented" key={"contract-method-" + entry.name}>
          <LabelledField label={entry.name} wideLabel={true}>
            { this.ToggleButton(entry.type.capitalize() + " Info", entry.name) }
          </LabelledField>

          { methodDisplayInfo }
        </div>
      );
    });
  }

  PageContent() {
    if(this.props.methodStatus.RemoveContract.completed) {
      return <Redirect push to={Path.dirname(this.props.match.url)}/>;
    }

    const description = <ClippedText className="object-description" text={this.props.contract.description} />;
    const abiDisplayInfo = this.state.visibleMethods["__abi"] ? <pre>{JSON.stringify(this.props.contract.abi, null, 2)}</pre> : null;
    const bytecodeDisplayInfo = this.state.visibleMethods["__bytecode"] ? <pre>{this.props.contract.bytecode}</pre> : null;

    const abi = this.props.contract.abi || [];
    const contractElements = Object.values(abi);
    const contractConstructor = contractElements.filter(element => element.type === "constructor");
    const contractEvents = contractElements.filter(element => element.type === "event");
    const contractMethods = contractElements.filter(element => element.type === "function");
    const constantMethods = contractMethods.filter(element => element.constant);
    const dynamicMethods = contractMethods.filter(element => !element.constant);

    return (
      <div className="page-container contracts-page-container">
        <div className="actions-container">
          <Action type="link" to={"/contracts/saved"} className="secondary">Back</Action>
          <Action type="link" to={UrlJoin(this.props.match.url, "edit")}>Edit Contract</Action>
          <Action type="link" to={UrlJoin(this.props.match.url, "deploy")}>Deploy Contract</Action>
          <Action className="delete-action" onClick={this.DeleteContract}>Delete Contract</Action>
        </div>
        <PageHeader header={this.props.contractName} />
        <div className="page-content">
          <div className="label-box">
            <h3>Contract Info</h3>
            <LabelledField label="Description">
              { description }
            </LabelledField>

            <LabelledField label="ABI">
              { this.ToggleButton("Full ABI", "__abi") }
            </LabelledField>

            { abiDisplayInfo }

            <LabelledField label="Bytecode">
              { this.ToggleButton("Bytecode", "__bytecode") }
            </LabelledField>

            { bytecodeDisplayInfo }

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
      <LoadingElement
        fullPage={true}
        loading={this.props.methodStatus.RemoveContract.loading}
        render={this.PageContent}
      />
    );
  }
}

Contract.propTypes = {
  contract: PropTypes.object.isRequired,
  contractName: PropTypes.string.isRequired,
  methods: PropTypes.shape({
    RemoveContract: PropTypes.func.isRequired
  })
};

export default Contract;
