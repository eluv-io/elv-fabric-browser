import React from "react";
import { Link } from "react-router-dom";
import Path from "path";

import RequestPage from "../RequestPage";
import { LibraryCard } from "../../components/DisplayCards";

import ContractIcon from "../../../static/icons/contracts.svg";

class Contracts extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      viewDeployed: true
    };

    this.PageContent = this.PageContent.bind(this);
  }

  componentDidMount() {
    this.setState({
      requestId: this.props.WrapRequest({
        todo: async () => {
          await this.props.ListContracts();
          await this.props.ListDeployedContracts();
        }
      })
    });
  }

  ToggleView() {
    return (
      <div className="actions-container">
        <button
          className={
            "action action-compact action-wide action-inline " +
            (this.state.viewDeployed ? "tertiary" : "secondary")
          }
          onClick={() => { this.setState({viewDeployed: true}); }}
        >
          Watched Contracts
        </button>
        <button
          className={
            "action action-compact action-wide action-inline " +
            (this.state.viewDeployed ? "secondary" : "tertiary")
          }
          onClick={() => { this.setState({viewDeployed: false}); }}
        >
          Saved Contracts
        </button>
      </div>
    );
  }

  SavedContracts() {
    const contracts = this.state.viewDeployed ? this.props.deployedContracts : this.props.contracts;
    return (
      Object.keys(contracts).map(contractId => {
        const contract = contracts[contractId];
        let eventCount = Object.values(contract.abi).filter(element => element.type === "event").length;
        eventCount = eventCount === 1 ? eventCount + " event" : eventCount + " events";

        let methodCount = Object.values(contract.abi).filter(element => element.type === "function").length;
        methodCount = methodCount === 1 ? methodCount + " method" : methodCount + " methods";

        const link = this.state.viewDeployed ?
          Path.join("/contracts", "deployed", contractId) :
          Path.join("/contracts", contractId);

        return (
          <div className="contracts" key={"contract-" + contractId}>
            <LibraryCard
              icon={ContractIcon}
              link={link}
              name={contract.name}
              infoText={`${eventCount}, ${methodCount}`}
              description={contract.description}
              title={"Contract " + contract.name}/>
          </div>
        );
      })
    );
  }

  PageContent() {
    return (
      <div className="page-container contents-page-container">
        <div className="actions-container">
          <Link to="/contracts/compile" className="action" >New Contract</Link>
          <Link to="/contracts/deploy" className="action" >Deploy Contract</Link>
          <Link to="/contracts/watch" className="action" >Watch Contract</Link>
        </div>
        <h3 className="page-header">Contracts</h3>
        { this.ToggleView() }
        { this.SavedContracts() }
      </div>
    );
  }

  render() {
    return (
      <RequestPage
        requestId={this.state.requestId}
        requests={this.props.requests}
        pageContent={this.PageContent}
      />
    );
  }
}

export default Contracts;
