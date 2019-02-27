import React from "react";
import Path from "path";
import PropTypes from "prop-types";
import {PageHeader} from "../../../components/Page";
import EventLogs from "../../../components/EventLogs";
import Action from "elv-components-js/src/components/Action";

class DeployedContractEvents extends React.Component {
  render() {
    return (
      <div className="page-container contracts-page-container">
        <div className="actions-container">
          <Action type="link" to={Path.dirname(this.props.match.url)} className="secondary">Back</Action>
        </div>
        <PageHeader header={this.props.contract.name} subHeader={this.props.contract.description} />
        <div className="page-content">
          <div className="label-box">
            <div className="contract-events">
              <EventLogs
                events={this.props.deployedContract.events || []}
                RequestMethod={this.props.methods.GetContractEvents}
                ClearMethod={this.props.methods.ClearContractEvents}
                loading={this.props.methodStatus.GetContractEvents.loading}
                contractAddress={this.props.contract.address}
                abi={this.props.contract.abi}
              />
            </div>
          </div>
        </div>
      </div>
    );
  }
}

DeployedContractEvents.propTypes = {
  contract: PropTypes.object.isRequired,
  deployedContract: PropTypes.object.isRequired,
  methods: PropTypes.shape({
    GetContractEvents: PropTypes.func.isRequired,
    ClearContractEvents: PropTypes.func.isRequired
  })
};

export default DeployedContractEvents;
