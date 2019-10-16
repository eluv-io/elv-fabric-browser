import React from "react";
import PropTypes from "prop-types";
import {FormatAddress, ParseBytes32} from "../../utils/Helpers";
import Fabric from "../../clients/Fabric";
import {Balance, Copy, ImageIcon} from "elv-components-js";
import {inject, observer} from "mobx-react";
import {Tabs} from "elv-components-js";

import ClipboardIcon from "../../static/icons/clipboard.svg";

@inject("eventsStore")
@observer
class EventLogs extends React.PureComponent {
  constructor(props) {
    super(props);

    this.state = {
      view: "formatted"
    };
  }

  Key(log) {
    return `log-${log.transactionHash}-${log.logIndex}`;
  }

  Inputs(log) {
    if(!log.values) { return []; }

    return Object.entries(log.values)
      .filter(([key]) => key !== "length" && parseInt(key).toString() !== key)
      .map(([key, value]) => {
        if(value === null || value === undefined) {
          return [key, "null"];
        } else if(typeof value === "object" && value._hex) {
          return [key, `${parseInt(value._hex, 16)} (${value._hex})`];
        } else if(value.length === 66) {
          // bytes32
          return [key, ParseBytes32(value), value];
        } else if(value.toString().startsWith("0x") && value.length === 42) {
          return [key, FormatAddress(value)];
        } else {
          return [key, value.toString()];
        }
      });
  }

  InputFields(log) {
    const inputs = this.Inputs(log);

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

  Id(log) {
    let contractName = this.props.eventsStore.contractNames[FormatAddress(log.address)];
    if(!contractName || contractName === "Unknown") {
      contractName = log.contract;
    }

    let id;
    switch(contractName) {
      case "BaseContentSpace":
        id = Fabric.utils.AddressToSpaceId(log.address);
        break;

      case "BaseLibrary":
        id = Fabric.utils.AddressToLibraryId(log.address);
        break;

      case "BaseContent":
      case "BaseContentType":
      case "BsAccessWallet":
      case "BsAccessCtrlGrp":
        id = Fabric.utils.AddressToObjectId(log.address);
        break;

      default:
        return;
    }

    return id;
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
    if(log.address) {
      return FormatAddress(log.address);
    }

    return log.toName ?
      <span>{log.toName}<span className="help-text">({FormatAddress(log.to)})</span></span> :
      FormatAddress(log.to);
  }

  ParsedLog(log) {
    let contractName = this.props.eventsStore.contractNames[FormatAddress(log.address)];
    if(!contractName || contractName === "Unknown") {
      contractName = log.contract;
    }

    let eventName;

    if(contractName && contractName !== "Unknown") {
      eventName = log.name ?  `${contractName} ｜ ${log.name}` : contractName;
    } else {
      eventName = log.name;
    }

    const id = this.Id(log);
    let idDetails;
    if(id) {
      idDetails = (
        <div className="labelled-field">
          <label>ID</label>
          <div className="value">{id}</div>
        </div>
      );
    }

    return (
      <div className="log" key={this.Key(log)}>
        <div className="header">
          <div className="title bold">{eventName || "Transaction"}</div>
          <div className="info">{(log.logIndex || 0) + 1}</div>
        </div>
        <div className="inputs indented">
          <div className="labelled-field">
            <label>Transaction Hash</label>
            <div className="value">{log.transactionHash}</div>
          </div>
          { idDetails }
          <div className="labelled-field">
            <label>{log.address ? "Contract Address" : "To"}</label>
            <div className="value">{this.To(log)}</div>
          </div>
          <div className="labelled-field">
            <label>From</label>
            <div className="value">{this.From(log)}</div>
          </div>
          { this.Value(log.value) }
          { this.InputFields(log) }
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
          { event.map(log => log.name ? this.ParsedLog(log) : this.ParsedLog(log)) }
        </div>
      </div>
    );
  }

  // Raw text version of logs
  Text(events) {
    return events.map(event => {
      if(!Array.isArray(event)) { event = [event]; }

      if(!event) { return; }

      const blockNumber = event && event[0] ? event[0].blockNumber : "unknown";

      const logs = event.map(log => {
        let contractName = this.props.eventsStore.contractNames[FormatAddress(log.address)];
        if(!contractName || contractName === "Unknown") {
          contractName = log.contract;
        }

        let eventName;

        if(contractName && contractName !== "Unknown") {
          eventName = log.name ?  `${contractName} ｜ ${log.name}` : contractName;
        } else {
          eventName = log.name;
        }

        const id = this.Id(log);
        const inputs = this.Inputs(log);
        const value = Fabric.utils.WeiToEther(parseInt(log.value._hex, 16));
        const valueInfo = value && value > 0 ? `Value: ${value}` : "";

        let inputFields;
        if(inputs.length > 0) {
          inputFields = inputs.map(([key, value]) => `${key}: ${value}`);
          inputFields.unshift("Method Inputs");
          inputFields = inputFields.join("\n\t\t");
        }

        let to;
        if(log.address) {
          to = `Contract Address: ${FormatAddress(log.address)}`;
        } else {
          to = log.toName ? `${log.toName} (${FormatAddress(log.to)}` : FormatAddress(log.to);
        }

        return [
          eventName,
          `Transaction Hash: ${log.hash}`,
          (id ? `ID: ${this.Id(log)}`: ""),
          to,
          `From: ${log.fromName ? `${log.fromName} (${FormatAddress(log.from)})` : FormatAddress(log.from)}`,
          valueInfo,
          inputFields
        ]
          .filter(l => l)
          .join("\n\t");
      }).join("\n\n\t");

      return [
        `Block ${blockNumber}`,
        `\t${logs}`
      ].join("\n");
    })
      .filter(e => e)
      .join("\n\n");
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
          (log.contractAddress || "").toLowerCase().includes(filter) ||
          (
            (this.props.eventsStore.contractNames[FormatAddress(log.address)] || "")
              .toLowerCase().includes(filter)
          )
        )
      );
    }

    if(filteredEvents.length === 0) { return <h4>No events found</h4>; }

    return (
      <div className="events-page">
        <Tabs
          options={[["Formatted", "formatted"], ["Raw", "raw"]]}
          selected={this.state.view}
          onChange={view => this.setState({view})}
        />

        <div className="events-container">
          {
            this.state.view === "formatted" ?
              filteredEvents.map(event => this.RenderEvent(event)) :
              <div className="events-raw">
                <Copy copy={this.Text(filteredEvents)} className="events-copy-button">
                  <ImageIcon
                    icon={ClipboardIcon}
                  />
                </Copy>
                <pre className="events-raw-text">
                  { this.Text(filteredEvents) }
                </pre>
              </div>
          }

          <div
            ref={(bottom)=> {
              if(bottom && this.props.scrollToBottom) {
                bottom.scrollIntoView();
              }
            }}
          />
        </div>
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
