import React from "react";
import EventLogs from "./EventLogs";
import PropTypes from "prop-types";
import {Action, LoadingElement, IconButton, onEnterPressed} from "elv-components-js";

import WatchIcon from "../../static/icons/eye.svg";
import StopWatchingIcon from "../../static/icons/eye-off.svg";

class Events extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      // Separate visible input from actual filter for debouncing
      filterInput: "",
      filter: "",
      filtering: false,

      fromBlock: 0,
      toBlock: 0,
      scrollToBottom: false,
      watchEvents: false,
      watcher: undefined
    };

    this.Reset = this.Reset.bind(this);
    this.HandleInputChange = this.HandleInputChange.bind(this);
    this.HandleFilterChange = this.HandleFilterChange.bind(this);
    this.LoadMoreEvents = this.LoadMoreEvents.bind(this);
    this.ToggleWatch = this.ToggleWatch.bind(this);
  }

  componentDidMount() {
    this.Request();
  }

  componentWillUnmount() {
    this.CancelWatch();

    // Clear logs to free up memory
    this.props.ClearMethod({contractAddress: this.props.contractAddress});
  }

  Loading() {
    return (this.props.loading && !this.state.watchEvents) || this.state.filtering;
  }

  HandleInputChange(event) {
    this.setState({
      [event.target.name]: parseInt(event.target.value)
    });
  }

  // Debounce filter input
  HandleFilterChange(event) {
    const value = event.target.value;

    if(this.state.filterTimeout) {
      clearTimeout(this.state.filterTimeout);
    }

    this.setState({
      filterInput: value,
      filtering: true,
      filterTimeout: setTimeout(
        () => {
          this.CancelWatch();

          this.setState({
            filter: value,
            filtering: false
          });
        }, 500
      ),
      scrollToBottom: false
    });
  }

  Watch() {
    this.setState({
      watchEvents: true,
      watcher: setTimeout(async () => {
        this.setState({
          scrollToBottom: false
        }, async () => await this.Request({fromBlock: this.state.toBlock, updateFrom: false, cancelWatch: false}));

        this.Watch();
      }, 3000)
    });
  }

  CancelWatch() {
    clearTimeout(this.state.watcher);

    this.setState({
      watchEvents: false
    });
  }

  ToggleWatch() {
    if(this.state.watchEvents) {
      this.CancelWatch();
    } else {
      this.Watch();
    }
  }

  Reset() {
    this.setState({
      filter: "",
      filterInput: ""
    }, () => this.Request({clear: true}));
  }

  async Request({fromBlock, toBlock, updateFrom=true, updateTo=true, cancelWatch=true, clear=false}={}) {
    if(cancelWatch) {
      this.CancelWatch();
    }

    const latestBlock = await this.props.GetBlockNumber();

    if(!toBlock || toBlock > latestBlock) {
      toBlock = latestBlock;
    }

    if(fromBlock === undefined || fromBlock < 0) {
      if(this.props.contractAddress) {
        fromBlock = 0;
      } else {
        fromBlock = Math.max(1, toBlock - 10);
      }
    }

    if(toBlock < fromBlock) {
      fromBlock = toBlock;
    }

    this.props.RequestMethod({
      contractAddress: this.props.contractAddress,
      abi: this.props.abi,
      fromBlock,
      toBlock,
      clear
    });

    this.setState({
      fromBlock: updateFrom ? fromBlock : this.state.fromBlock,
      toBlock: updateTo ? toBlock : this.state.toBlock
    });
  }

  async LoadMoreEvents() {
    this.Request({
      fromBlock: this.state.fromBlock - 10,
      toBlock: this.state.toBlock
    });

    this.setState({scrollToBottom: true});
  }

  LoadMoreEventsButton() {
    if(this.state.fromBlock <= 1) { return null; }

    return (
      <LoadingElement loading={this.Loading()} noIndicator={true}>
        <Action onClick={this.LoadMoreEvents}>
          Load More Events
        </Action>
      </LoadingElement>
    );
  }

  FilterControls() {
    const watchIcon = this.state.watchEvents ? StopWatchingIcon : WatchIcon;
    const watchIconLabel = this.state.watchEvents ? "Stop Watching Events" : "Watch Events";
    const watchIconClassname = this.state.watchEvents ? "watch-icon watching" : "watch-icon";
    const request = () => this.Request({toBlock: this.state.toBlock, fromBlock: this.state.fromBlock, clear: true});
    return (
      <div className="event-controls">
        <div className="control-group filter-group">
          <input
            name="filterInput"
            className="event-filter"
            value={this.state.filterInput}
            onChange={this.HandleFilterChange}
            placeholder="Filter"
          />
        </div>
        <div className="control-group">
          <label htmlFor="fromBlock">From</label>
          <input
            type="number"
            name="fromBlock"
            value={this.state.fromBlock}
            onChange={this.HandleInputChange}
            onKeyPress={onEnterPressed(request)}
          />

          <label htmlFor="toBlock">To</label>
          <input
            type="number"
            name="toBlock"
            value={this.state.toBlock}
            onChange={this.HandleInputChange}
            onKeyPress={onEnterPressed(request)}
          />
        </div>

        <div className="control-group action-group">
          <LoadingElement loading={this.Loading()} loadingIcon="rotate" loadingClassname="filter-loading">
            <Action onClick={request}>
              Update
            </Action>
            <Action className="secondary" onClick={this.Reset}>
              Reset
            </Action>
          </LoadingElement>
        </div>

        <IconButton
          icon={watchIcon}
          label={watchIconLabel}
          title={watchIconLabel}
          className={watchIconClassname}
          onClick={this.ToggleWatch}
        />
      </div>
    );
  }

  render() {
    return (
      <div className="events">
        { this.FilterControls()}

        <LoadingElement loading={this.Loading()} noIndicator={true}>
          <EventLogs events={this.props.events} filter={this.state.filter} scrollToBottom={this.state.scrollToBottom}/>
        </LoadingElement>

        <div className="load-more">
          { this.LoadMoreEventsButton() }
        </div>
      </div>
    );
  }
}

Events.propTypes = {
  events: PropTypes.arrayOf(PropTypes.arrayOf(PropTypes.object)).isRequired,
  RequestMethod: PropTypes.func.isRequired,
  ClearMethod: PropTypes.func.isRequired,
  GetBlockNumber: PropTypes.func.isRequired,
  loading: PropTypes.bool.isRequired,
  contractAddress: PropTypes.string,
  abi: PropTypes.array
};

export default Events;
