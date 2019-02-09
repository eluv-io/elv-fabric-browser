import React from "react";
import Path from "path";
import {PageHeader} from "../../components/Page";
import PageTabs from "../../components/PageTabs";
import Action from "../../components/Action";
import {ListingContainer} from "../../../containers/pages/Components";

class Contracts extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      view: "deployed"
    };

    this.LoadContracts = this.LoadContracts.bind(this);
    this.Contracts = this.Contracts.bind(this);
  }

  async LoadContracts() {
    await this.props.ListContracts();
    await this.props.ListDeployedContracts();
  }

  Contracts(view) {
    const contracts = view === "saved" ? this.props.contracts : this.props.deployedContracts;

    const content = Object.keys(contracts).map(contractId => {
      const link = view === "deployed" ?
        Path.join("/contracts", "deployed", contractId) :
        Path.join("/contracts", contractId);

      const contract = contracts[contractId];
      let eventCount = Object.values(contract.abi).filter(element => element.type === "event").length;
      eventCount = eventCount === 1 ? eventCount + " event" : eventCount + " events";

      let methodCount = Object.values(contract.abi).filter(element => element.type === "function").length;
      methodCount = methodCount === 1 ? methodCount + " method" : methodCount + " methods";

      return {
        id: contractId,
        title: contract.name,
        description: contract.description,
        status: `${eventCount}, ${methodCount}`,
        link
      };
    });

    return content;
  }

  render() {
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
        <ListingContainer
          pageId="Contracts"
          LoadContent={this.LoadContracts}
          RenderContent={() => this.Contracts(this.state.view)}
          noIcon={true}
        />
      </div>
    );
  }
}

export default Contracts;
