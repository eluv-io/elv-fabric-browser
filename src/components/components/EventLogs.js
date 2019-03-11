import React from "react";
import PropTypes from "prop-types";
import {FormatAddress, ParseBytes32} from "../../utils/Helpers";
import Fabric from "../../clients/Fabric";

class EventLogs extends React.PureComponent {
  Key(log) {
    return `log-${log.transactionHash}-${log.logIndex}`;
  }

  Inputs(log) {
    const inputs = Object.entries(log.values)
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

  ParsedLog(log) {
    const eventName = log.contract ? `${log.contract} :: ${log.name}` : log.name;
    const value = log.value ? Fabric.utils.WeiToEther(parseInt(log.value._hex, 16)) : 0;
    return (
      <div className="log" key={this.Key(log)} title={JSON.stringify(log, null, 2)}>
        <div className="header">
          <div className="title bold">{eventName}</div>
          <div className="info">{log.logIndex}</div>
        </div>
        <div className="inputs indented">
          <div className="labelled-field">
            <label>Transaction Hash</label>
            <div className="value">{Fabric.utils.AddressToHash(log.transactionHash)}</div>
          </div>
          <div className="labelled-field">
            <label>ID</label>
            <div className="value">{Fabric.utils.AddressToHash(log.address)}</div>
          </div>
          <div className="labelled-field">
            <label>Contract Address</label>
            <div className="value">{log.address}</div>
          </div>
          <div className="labelled-field">
            <label>From</label>
            <div className="value">{log.from}</div>
          </div>
          <div className="labelled-field">
            <label>Value</label>
            <div className="value">{"φ" + value}</div>
          </div>
          { this.Inputs(log) }
        </div>
      </div>
    );
  }

  RawLog(log) {
    const to = FormatAddress(log.to);
    const from = FormatAddress(log.from);
    const value = log.value ? Fabric.utils.WeiToEther(parseInt(log.value._hex, 16)) : 0;
    return (
      <div className="log" key={this.Key(log)} title={JSON.stringify(log, null, 2)}>
        <div className="header">
          <div className="title" />
          <div className="info">{log.logIndex}</div>
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

  RenderEvent(event) {
    if(!Array.isArray(event)) { event = [event]; }

    const blockNumber = event && event[0] ? event[0].blockNumber : "unknown";
    return (
      <div className="event" key={"event-" + blockNumber}>
        <div className="header">
          <div className="title">{"Block " + blockNumber}</div>
          <div className="info">{blockNumber}</div>
        </div>
        <div className="logs">
          { event.map(log => log.name ? this.ParsedLog(log) : this.RawLog(log)) }
        </div>
      </div>
    );
  }

  render() {
    let filteredEvents = this.props.events;

    if(this.props.filter) {
      const filter = this.props.filter.toLowerCase();

      filteredEvents = filteredEvents.filter(event =>
        event.find(log =>
          (log.contract || "").toLowerCase().includes(filter) ||
          (log.name || "").toLowerCase().includes(filter) ||
          (log.address || "").toLowerCase().includes(filter)
        )
      );
    }

    if(filteredEvents.length === 0) { return <h4>No events found</h4>; }

    return (
      <div className="events-container">
        { filteredEvents.map(event => this.RenderEvent(event)) }
        <div
          ref={(bottom)=> {
            if(bottom && this.props.scrollToBottom) {
              bottom.scrollIntoView();
            }
          }}
        />
      </div>
    );
  }
}

EventLogs.propTypes = {
  events: PropTypes.arrayOf(
    PropTypes.arrayOf(
      PropTypes.object
    )
  ).isRequired,
  filter: PropTypes.string,
  scrollToBottom: PropTypes.bool
};

export default EventLogs;
