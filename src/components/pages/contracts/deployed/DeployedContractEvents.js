import React from "react";
import { Link } from "react-router-dom";
import Path from "path";
import PropTypes from "prop-types";
import DeployedContractWrapper from "./DeployedContractWrapper";
import {PageHeader} from "../../../components/Page";
import EventLogs from "../../../components/EventLogs";

class DeployedContractEvents extends React.Component {
  ContractEvents() {
    const contractState = this.props.deployedContracts[this.props.contract.address];

    if(!contractState) { return null; }

    return <EventLogs
      WrapRequest={this.props.WrapRequest}
      requests={this.props.requests}
      events={contractState.events || []}
      RequestMethod={this.props.GetContractEvents}
      ClearMethod={this.props.ClearContractEvents}
      contractAddress={this.props.contract.address}
      abi={this.props.contract.abi}
    />;
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
