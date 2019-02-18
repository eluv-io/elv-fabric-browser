import React from "react";
import PropTypes from "prop-types";
import {FormatAddress, ParseBytes32} from "../../utils/Helpers";
import Fabric from "../../clients/Fabric";

class EventCard extends React.Component {
  Key(event) {
    return `event-${event.transactionHash}-${event.logIndex}`;
  }

  Inputs(event) {
    const inputs = Object.entries(event.values)
      .filter(([key]) => key !== "length" && parseInt(key).toString() !== key)
      .map(([key, value]) => {
        if(typeof value === "object" && value._hex) {
          return [key, `${parseInt(value._hex, 16)} (${value._hex})`];
        } else if(value.length === 66) {
          // bytes32
          return [key, ParseBytes32(value), value];
        } else {
          return [key, value];
        }
      });

    if(inputs.length === 0) { return null; }

    const inputFields = inputs.map(([key, value]) => {
      return (
        <div className="labelled-field" key={"input-" + key}>
          <label>{key}</label>
          <div className="value" title={value.toString()}>{value}</div>
        </div>
      );
    });

    return (
      <div className="transaction-input">
        <div className="section-label">
          Method Inputs
        </div>
        { inputFields }
      </div>
    );
  }

  ParsedEvent(event) {
    const eventName = event.contract ? `${event.contract} :: ${event.name}` : event.name;
    const value = event.value ? Fabric.utils.WeiToEther(parseInt(event.value._hex, 16)) : 0;
    return (
      <div className="event" key={this.Key(event)} title={JSON.stringify(event, null, 2)}>
        <div className="header">
          <div className="title bold">{eventName}</div>
          <div className="info">{event.logIndex}</div>
        </div>
        <div className="inputs indented">
          <div className="labelled-field">
            <label>Transaction Hash</label>
            <div className="value">{Fabric.utils.AddressToHash(event.transactionHash)}</div>
          </div>
          <div className="labelled-field">
            <label>ID</label>
            <div className="value">{Fabric.utils.AddressToHash(event.address)}</div>
          </div>
          <div className="labelled-field">
            <label>Contract Address</label>
            <div className="value">{event.address}</div>
          </div>
          <div className="labelled-field">
            <label>From</label>
            <div className="value">{event.from}</div>
          </div>
          <div className="labelled-field">
            <label>Value</label>
            <div className="value">{"φ" + value}</div>
          </div>
          { this.Inputs(event) }
        </div>
      </div>
    );
  }

  RawEvent(event) {
    const to = FormatAddress(event.to);
    const from = FormatAddress(event.from);
    const value = event.value ? Fabric.utils.WeiToEther(parseInt(event.value._hex, 16)) : 0;
    return (
      <div className="event" key={this.Key(event)} title={JSON.stringify(event, null, 2)}>
        <div className="header">
          <div className="title" />
          <div className="info">{event.logIndex}</div>
        </div>
        <div className="indented">
          <div className="labelled-field">
            <label>From</label>
            <div className="value">{from}</div>
          </div>
          <div className="labelled-field">
            <label>To</label>
            <div className="value">{to}</div>
          </div>
          <div className="labelled-field">
            <label>Value</label>
            <div className="value">{"φ" + value}</div>
          </div>
        </div>
      </div>
    );
  }

  AllEvents() {
    return this.props.events.map(event => {
      if(event.name) {
        return this.ParsedEvent(event);
      } else {
        return this.RawEvent(event);
      }
    });
  }

  render() {
    return (
      <div className="transaction" key={"event-" + this.props.events[0].blockNumber}>
        <div className="header">
          <div className="title">{"Block " + this.props.events[0].blockNumber}</div>
          <div className="info">{this.props.events[0].transactionHash}</div>
        </div>
        <div className="events">
          { this.AllEvents() }
        </div>
      </div>
    );
  }
}

EventCard.propTypes = {
  events: PropTypes.arrayOf(PropTypes.object).isRequired
};

export default EventCard;
