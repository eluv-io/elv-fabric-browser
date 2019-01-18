import React from "react";
import PropTypes from "prop-types";

class TransactionCard extends React.Component {
  FilteredEvents() {
    const events = this.props.events.map(event => {
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

    return events;
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
    return this.FilteredEvents().map(event => {
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
      <div className="transaction">
        <div className="header">
          <div className="title">{"Block " + this.props.events[0].blockNumber}</div>
          <div className="info">{this.props.events[0].transactionHash}</div>
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
