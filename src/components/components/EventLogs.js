import React from "react";
import PropTypes from "prop-types";
import {FormatAddress, ParseBytes32} from "../../utils/Helpers";
import Fabric from "../../clients/Fabric";
import {Balance} from "elv-components-js";
import {inject, observer} from "mobx-react";

@inject("eventsStore")
@observer
class EventLogs extends React.PureComponent {
  Key(log) {
    return `log-${log.transactionHash}-${log.logIndex}`;
  }

  Inputs(log) {
    const inputs = Object.entries(log.values)
      .filter(([key]) => key !== "length" && parseInt(key).toString() !== key)
      .map(([key, value]) => {
        if(value === null || value === undefined) {
          return [key, "null"];
        } else if(typeof value === "object" && value._hex) {
          return [key, `${parseInt(value._hex, 16)} (${value._hex})`];
        } else if(value.length === 66) {
          // bytes32
          return [key, ParseBytes32(value), value];
        } else {
          return [key, value.toString()];
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

  Id(contractName, address) {
    let id;
    switch(contractName) {
      case "BaseContentSpace":
        id = Fabric.utils.AddressToSpaceId(address);
        break;

      case "BaseLibrary":
        id = Fabric.utils.AddressToLibraryId(address);
        break;

      case "BaseContent":
      case "BsAccessWallet":
      case "BsAccessCtrlGrp":
        id = Fabric.utils.AddressToObjectId(address);
        break;

      default:
        return;
    }

    return (
      <div className="labelled-field">
        <label>ID</label>
        <div className="value">{id}</div>
      </div>
    );
  }

  Value(value) {
    value = value ? Fabric.utils.WeiToEther(parseInt(value._hex, 16)) : "0";

    // Hide value info if none was exchanged
    if(value.toString() === "0") {
      return null;
    }

    return (
      <div className="labelled-field">
        <label>Value</label>
        <div className="value">
          <Balance balance={value.toString()} />
        </div>
      </div>
    );
  }

  From(log) {
    return log.fromName ?
      <span>{log.fromName}<span className="help-text">({FormatAddress(log.from)})</span></span> :
      FormatAddress(log.from);
  }

  To(log) {
    if(!log.to) {
      return FormatAddress(log.contractAddress);
    }

    return log.toName ?
      <span>{log.toName}<span className="help-text">({FormatAddress(log.to)})</span></span> :
      FormatAddress(log.to);
  }

  ParsedLog(log) {
    const contractName = this.props.eventsStore.contractNames[FormatAddress(log.address)];
    const eventName = contractName && contractName !== "Unknown" ?
      `${contractName} ｜ ${log.name}` : log.name;

    return (
      <div className="log" key={this.Key(log)}>
        <div className="header">
          <div className="title bold">{eventName}</div>
          <div className="info">{log.logIndex}</div>
        </div>
        <div className="inputs indented">
          <div className="labelled-field">
            <label>Transaction Hash</label>
            <div className="value">{log.transactionHash}</div>
          </div>
          { this.Id(contractName, log.address) }
          <div className="labelled-field">
            <label>Contract Address</label>
            <div className="value">{FormatAddress(log.address)}</div>
          </div>
          <div className="labelled-field">
            <label>From</label>
            <div className="value">{this.From(log)}</div>
          </div>
          { this.Value(log.value) }
          { this.Inputs(log) }
        </div>
      </div>
    );
  }

  RawLog(log) {
    return (
      <div className="log" key={this.Key(log)}>
        <div className="header">
          <div className="title" />
          <div className="info">{log.logIndex}</div>
        </div>
        <div className="indented">
          <div className="labelled-field">
            <label>Transaction Hash</label>
            <div className="value">{log.hash}</div>
          </div>
          <div className="labelled-field">
            <label>From</label>
            <div className="value">{this.From(log)}</div>
          </div>
          <div className="labelled-field">
            <label>{!log.to && log.contractAddress ? "Contract Address" : "To"}</label>
            <div className="value">{this.To(log)}</div>
          </div>
          { this.Value(log.value) }
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
          (log.address || "").toLowerCase().includes(filter) ||
          (log.to || "").toLowerCase().includes(filter) ||
          (log.from || "").toLowerCase().includes(filter) ||
          (log.contractAddress || "").toLowerCase().includes(filter)
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
