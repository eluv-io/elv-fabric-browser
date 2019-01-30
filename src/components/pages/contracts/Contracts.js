import React from "react";
import Path from "path";

import RequestPage from "../RequestPage";
import { LibraryCard } from "../../components/DisplayCards";

import ContractIcon from "../../../static/icons/contracts.svg";
import {PageHeader} from "../../components/Page";
import PageTabs from "../../components/PageTabs";
import Action from "../../components/Action";

class Contracts extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      view: "deployed"
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

  Contracts() {
    const contracts = this.state.view === "saved" ? this.props.contracts : this.props.deployedContracts;

    if(Object.keys(contracts).length === 0) {
      return (
        <h4>{`No ${this.state.view} contracts`}</h4>
      );
    }

    return (
      Object.keys(contracts).map(contractId => {
        const contract = contracts[contractId];
        let eventCount = Object.values(contract.abi).filter(element => element.type === "event").length;
        eventCount = eventCount === 1 ? eventCount + " event" : eventCount + " events";

        let methodCount = Object.values(contract.abi).filter(element => element.type === "function").length;
        methodCount = methodCount === 1 ? methodCount + " method" : methodCount + " methods";

        const link = this.state.view === "deployed" ?
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
    const tabs = (
      <PageTabs
        options={[
          ["Deployed Contracts", "deployed"],
          ["Saved Contracts", "saved"]
        ]}
        selected={this.state.view}
        onChange={(value) => this.setState({view: value})}
      />
    );

    return (
      <div className="page-container contents-page-container">
        <div className="actions-container">
          <Action type="link" to="/contracts/compile">New Contract</Action>
          <Action type="link" to="/contracts/deploy">Deploy Contract</Action>
          <Action type="link" to="/contracts/watch">Watch Contract</Action>
        </div>
        <PageHeader header="Contracts" />
        { tabs }
        { this.Contracts() }
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
