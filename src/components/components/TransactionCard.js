import React from "react";
import PropTypes from "prop-types";

class TransactionCard extends React.Component {
  constructor(props) {
    super(props);

    const events = props.events.map(event => {
      // Filter out numbered arguments and format hex inputs to decimal
      const inputs = Object.entries(event.values)
        .filter(([key]) => key !== "length" && parseInt(key).toString() !== key)
        .map(([key, value]) => {
          if(typeof value === "object" && value._hex) {
            return [key, `${parseInt(value._hex, 16)} (${value._hex})`];
          } else {
            return [key, value];
          }
        });

      delete event.data;

      return {
        event,
        inputs
      };
    });

    this.state = {
      events,
      blockNumber: events[0].event.blockNumber,
      transactionHash: events[0].event.transactionHash
    };
  }

  Inputs(inputs) {
    return inputs.map(([key, value]) => {
      return (
        <div className="input" key={"input-" + key}>
          <label>{key}</label>
          <div className="value">{value}</div>
        </div>
      );
    });
  }

  Events() {
    return this.state.events.map(event => {
      return (
        <div className="event" key={"event-" + JSON.stringify(event).toHash()} title={JSON.stringify(event.event, null, 2)}>
          <div className="header">
            <div className="title bold">{event.event.name}</div>
          </div>
          <div className="inputs indented">
            { this.Inputs(event.inputs) }
          </div>
        </div>
      );
    });
  }

  render() {
    return (
      <div className="transaction" title={JSON.stringify(this.state.event, null, 2)}>
        <div className="header">
          <div className="title">{"Block " + this.state.blockNumber}</div>
          <div className="info">{this.state.transactionHash}</div>
        </div>
        <div className="events">
          { this.Events() }
        </div>
      </div>
    );
  }
}

TransactionCard.propTypes = {
  events: PropTypes.arrayOf(PropTypes.object).isRequired
};

export default TransactionCard;
