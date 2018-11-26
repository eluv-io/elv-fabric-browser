import React from "react";
import { Link } from "react-router-dom";
import Path from "path";

import RequestPage from "../RequestPage";
import {SmallCard} from "../../components/DisplayCards";

class Contracts extends React.Component {
  constructor(props) {
    super(props);
    this.state = {};
  }

  componentDidMount() {
    this.setState({
      requestId: this.props.ListContracts()
    });
  }

  Contracts() {
    const contracts = this.props.contracts.contracts;
    return (
      Object.keys(contracts).map(contractName => {
        const contract = contracts[contractName];
        return (
          <div className="contracts" key={"contract-" + contractName}>
            <SmallCard
              link={Path.join("/contracts", contractName)}
              name={contractName}
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
