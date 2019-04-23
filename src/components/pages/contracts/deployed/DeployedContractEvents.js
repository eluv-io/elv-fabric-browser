import React from "react";
import Path from "path";
import PropTypes from "prop-types";
import {PageHeader} from "../../../components/Page";
import Events from "../../../components/Events";
import {Action} from "elv-components-js";

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
              <Events
                events={this.props.deployedContract.events || []}
                GetBlockNumber={this.props.GetBlockNumber}
                RequestMethod={this.props.methods.GetContractEvents}
                ClearMethod={this.props.ClearContractEvents}
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
  GetBlockNumber: PropTypes.func.isRequired,
  ClearContractEvents: PropTypes.func.isRequired,
  methods: PropTypes.shape({
    GetContractEvents: PropTypes.func.isRequired
  })
};

export default DeployedContractEvents;
