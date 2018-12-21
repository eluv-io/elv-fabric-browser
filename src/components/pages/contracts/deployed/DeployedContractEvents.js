import React from "react";
import { Link } from "react-router-dom";
import Path from "path";
import PropTypes from "prop-types";
import DeployedContractWrapper from "./DeployedContractWrapper";
import {PageHeader} from "../../../components/Page";
import {BallClipRotate} from "../../../components/AnimatedIcons";
import TransactionCard from "../../../components/TransactionCard";

class DeployedContractEvents extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      latestBlock: 0
    };
  }

  componentDidMount() {
    this.WatchContract();
  }

  // Ensure watching stops when component unmounts
  componentWillUnmount() {
    this.StopWatchingContract();
  }

  // Periodically query for contract events
  WatchContract() {
    this.setState({
      watcher: setTimeout(() => {
        this.WatchContract();
      }, 5000)
    });

    this.setState({eventsLoading: true});

    this.props.GetContractEvents({
      contractAddress: this.props.contract.address,
      abi: this.props.contract.abi,
      fromBlock: this.state.latestBlock + 1
    }).then(() => {
      // Keep track of latest block fetched so that only new blocks are requested after the initial query
      const events = this.props.deployedContracts[this.props.contract.address].events;
      let latestBlock = this.state.latestBlock;

      if(events.length > 0) { latestBlock = events[0].blockNumber; }

      this.setState({
        eventsLoading: false,
        latestBlock
      });
    });
  }

  StopWatchingContract() {
    if(this.state.watcher) {
      clearTimeout(this.state.watcher);
      this.setState({watcher: undefined});
    }
  }

  ContractEvents() {
    const contractState = this.props.deployedContracts[this.props.contract.address];
    if(!contractState || !contractState.events) { return null; }

    // Keys are strings, but must parse numerically to ensure proper ordering by blockNumber
    const sortedKeys = Object.keys(contractState.events).sort((a, b) => parseInt(b) - parseInt(a));

    return sortedKeys.map(blockNumber => {
      return <TransactionCard blockNumber={blockNumber} events={contractState.events[blockNumber]} key={blockNumber} />;
    });
  }

  render() {
    return (
      <div className="page-container contracts-page-container">
        <div className="actions-container">
          <Link to={Path.dirname(this.props.match.url)} className="action secondary" >Back</Link>
        </div>
        <div className="object-display">
          <PageHeader header={this.props.contract.name} subHeader={this.props.contract.description} />
          <div className="label-box">
            <h3 className="header-with-loader">
              Event Logs
              <BallClipRotate />
            </h3>
            <div className="contract-events">
              { this.ContractEvents() }
            </div>
          </div>
        </div>
      </div>
    );
  }
}

DeployedContractEvents.propTypes = {
  contract: PropTypes.object.isRequired
};

export default DeployedContractWrapper(DeployedContractEvents);
