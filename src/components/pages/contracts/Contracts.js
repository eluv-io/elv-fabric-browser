import React from "react";
import { Link } from "react-router-dom";
import Path from "path";

import RequestPage from "../RequestPage";
import { LibraryCard } from "../../components/DisplayCards";

import ContractIcon from "../../../static/icons/contracts.svg";
import {PageHeader} from "../../components/Page";
import PageTabs from "../../components/PageTabs";

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

  SavedContracts() {
    const contracts = this.state.view === "saved" ? this.props.contracts : this.props.deployedContracts;

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
          <Link to="/contracts/compile" className="action" >New Contract</Link>
          <Link to="/contracts/deploy" className="action" >Deploy Contract</Link>
          <Link to="/contracts/watch" className="action" >Watch Contract</Link>
        </div>
        <PageHeader header="Contracts" />
        { tabs }
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
