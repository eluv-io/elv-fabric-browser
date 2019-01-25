import React from "react";
import EventLogs from "../../components/EventLogs";

class Logs extends React.Component {
  render() {
    return (
      <div className="page-container">
        <div className="page-header-container">
          <h3 className="page-header">Ethereum Logs</h3>
        </div>
        <EventLogs
          WrapRequest={this.props.WrapRequest}
          RequestMethod={this.props.GetBlockchainEvents}
          ClearMethod={this.props.ClearBlockchainEvents}
          requests={this.props.requests}
          events={this.props.logs}
        />
      </div>
    );
  }
}

export default Logs;
