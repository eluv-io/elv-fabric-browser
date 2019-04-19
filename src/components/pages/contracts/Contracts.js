import React from "react";
import PropTypes from "prop-types";
import UrlJoin from "url-join";
import {PageHeader} from "../../components/Page";
import {Action, Tabs} from "elv-components-js";
import Listing from "../../components/Listing";

class Contracts extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      view: this.props.match.url.endsWith("/saved") ? "saved" : "deployed"
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
          pageId="Contracts"
          paginate={true}
          count={this.props.count.contracts}
          loadingStatus={this.props.methodStatus.ListContracts}
          LoadContent={(({params}) => this.props.methods.ListContracts({params}))}
          RenderContent={() => this.Contracts(this.props.contracts)}
          noIcon={true}
        />
      );
    } else {
      return (
        <Listing
          key="deployed-contracts-listing"
          pageId="Contracts"
          paginate={true}
          count={this.props.count.deployedContracts}
          loadingStatus={this.props.methodStatus.ListDeployedContracts}
          LoadContent={(({params}) => this.props.methods.ListDeployedContracts({params}))}
          RenderContent={() => this.Contracts(this.props.deployedContracts)}
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
        <div className="actions-container">
          <Action type="link" to="/contracts/compile">New Contract</Action>
          <Action type="link" to="/contracts/deploy">Deploy Contract</Action>
          <Action type="link" to="/contracts/watch">Watch Contract</Action>
        </div>
        <PageHeader header="Contracts" />
        { tabs }
        { this.ContractsListing() }
      </div>
    );
  }
}

Contracts.propTypes = {
  contracts: PropTypes.object.isRequired,
  deployedContracts: PropTypes.object.isRequired,
  methods: PropTypes.shape({
    ListContracts: PropTypes.func.isRequired
  })
};

export default Contracts;
