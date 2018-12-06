import React from "react";
import { Link } from "react-router-dom";
import Path from "path";

import RequestPage from "../RequestPage";
import { LibraryCard } from "../../components/DisplayCards";

import ContractIcon from "../../../static/icons/contracts.svg";

class Contracts extends React.Component {
  constructor(props) {
    super(props);
    this.state = {};
  }

  componentDidMount() {
    this.setState({
      requestId: this.props.WrapRequest({
        todo: async () => {
          await this.props.ListContracts();
        }
      })
    });
  }

  Contracts() {
    const contracts = this.props.contracts;
    return (
      Object.keys(contracts).map(contractName => {
        const contract = contracts[contractName];
        let eventCount = Object.values(contract.abi).filter(element => element.type === "event").length;
        eventCount = eventCount === 1 ? eventCount + " event" : eventCount + " events";

        let methodCount = Object.values(contract.abi).filter(element => element.type === "function").length;
        methodCount = methodCount === 1 ? methodCount + " method" : methodCount + " methods";

        return (
          <div className="contracts" key={"contract-" + contractName}>
            <LibraryCard
              icon={ContractIcon}
              link={Path.join("/contracts", contractName)}
              name={contractName}
              infoText={`${eventCount}, ${methodCount}`}
              description={contract.description}
              title={"Contract " + contractName}/>
          </div>
        );
      })
    )
  }

  PageContent() {
    return (
      <div className="page-container contents-page-container">
        <div className="actions-container">
          <Link to="/contracts/compile" className="action" >New Contract</Link>
        </div>
        <h3 className="page-header">Contracts</h3>
        { this.Contracts() }
      </div>
    );
  }

  render() {
    return (
      <RequestPage
        pageContent={this.PageContent()}
        requestId={this.state.requestId}
        requests={this.props.requests}
      />
    );
  }
}

export default Contracts;
