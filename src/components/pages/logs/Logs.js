import React from "react";
import PropTypes from "prop-types";
import Events from "../../components/Events";

class Logs extends React.Component {
  render() {
    return (
      <div className="page-container">
        <div className="page-header-container">
          <h3 className="page-header">Ethereum Logs</h3>
        </div>
        <Events
          events={this.props.logs}
          RequestMethod={this.props.methods.GetBlockchainEvents}
          ClearMethod={this.props.methods.ClearBlockchainEvents}
          loading={this.props.methodStatus.GetBlockchainEvents.loading}
        />
      </div>
    );
  }
}

Logs.propTypes = {
  logs: PropTypes.array.isRequired,
  methods: PropTypes.shape({
    GetBlockchainEvents: PropTypes.func.isRequired,
    ClearBlockchainEvents: PropTypes.func.isRequired
  })
};

export default Logs;
