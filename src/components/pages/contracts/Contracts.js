import React from "react";
import UrlJoin from "url-join";
import {PageHeader} from "../../components/Page";
import {Action, Tabs} from "elv-components-js";
import Listing from "../../components/Listing";
import {inject, observer} from "mobx-react";
import ContentLookup from "../../components/ContentLookup";

@inject("contractStore")
@observer
class Contracts extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      view: this.props.match.url.endsWith("/saved") ? "saved" : "deployed",
      listingVersion: 0
    };

    this.Contracts = this.Contracts.bind(this);
  }

  Contracts(contracts) {
    if(!contracts) { return []; }

    return Object.keys(contracts).map(contractId => {
      const link = this.state.view === "deployed" ?
        UrlJoin("/contracts", "deployed", contractId) :
        UrlJoin("/contracts", contractId);

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
  }

  ContractsListing() {
    if(this.state.view === "saved") {
      return (
        <Listing
          key="contracts-listing"
          className="compact"
          pageId="Contracts"
          paginate={true}
          count={this.props.contractStore.contractsCount}
          LoadContent={
            async ({params}) => {
              await this.props.contractStore.ListContracts({params});
              this.setState({listingVersion: this.state.listingVersion + 1});
            }
          }
          RenderContent={() => this.Contracts(this.props.contractStore.contracts)}
          noIcon={true}
        />
      );
    } else {
      return (
        <Listing
          key="deployed-contracts-listing"
          pageId="Contracts"
          paginate={true}
          count={this.props.contractStore.deployedContractsCount}
          LoadContent={
            async ({params}) => {
              await this.props.contractStore.ListDeployedContracts({params});
              this.setState({listingVersion: this.state.listingVersion + 1});
            }
          }
          RenderContent={() => this.Contracts(this.props.contractStore.deployedContracts)}
          noIcon={true}
        />
      );
    }
  }

  render() {
    const tabs = (
      <Tabs
        options={[
          ["Deployed", "deployed"],
          ["Saved", "saved"]
        ]}
        selected={this.state.view}
        onChange={(value) => this.setState({view: value})}
      />
    );

    return (
      <div className="page-container contents-page-container">
        <div className="actions-wrapper">
          <div className="actions-container content-lookup-actions-container">
            <Action type="link" to="/contracts/compile">New Contract</Action>
            <Action type="link" to="/contracts/deploy">Deploy Contract</Action>
            <Action type="link" to="/contracts/watch">Watch Contract</Action>
            <ContentLookup />
          </div>
        </div>
        <PageHeader header="Contracts" />
        { tabs }
        { this.ContractsListing() }
      </div>
    );
  }
}

export default Contracts;
