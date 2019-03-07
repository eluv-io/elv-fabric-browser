import React from "react";
import EventLogs from "./EventLogs";
import PropTypes from "prop-types";
import Action from "elv-components-js/src/components/Action";
import LoadingElement from "elv-components-js/src/components/LoadingElement";

import WatchIcon from "../../static/icons/eye.svg";
import StopWatchingIcon from "../../static/icons/eye-off.svg";
import {IconButton} from "elv-components-js/src/components/Icons";

class Events extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      latestBlock: 0,
      earliestBlock: Number.MAX_SAFE_INTEGER,
      filterInput: "",
      filter: "",
      filtering: false,
      fromBlock: 0,
      toBlock: 0,
      scrollToBottom: false,
      watchEvents: false,
      watcher: undefined
    };

    this.FilterEvents = this.FilterEvents.bind(this);
    this.HandleInputChange = this.HandleInputChange.bind(this);
    this.HandleFilterChange = this.HandleFilterChange.bind(this);
    this.LoadMoreEvents = this.LoadMoreEvents.bind(this);
    this.ToggleWatch = this.ToggleWatch.bind(this);
  }

  async componentDidMount() {
    await this.RequestEvents();
  }

  async componentDidUpdate() {
    if(this.props.events.length > 0) {
      await this.UpdateBlockNumbers();
    }
  }

  componentWillUnmount() {
    clearTimeout(this.state.watcher);
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
        () => this.setState({
          filter: value,
          filtering: false
        }),
        500
      ),
      scrollToBottom: false
    });
  }

  Watch() {
    this.setState({
      watcher: setTimeout(async () => {
        this.setState({
          scrollToBottom: false
        }, async () => await this.RequestEvents());

        this.Watch();
      }, 3000)
    });
  }

  ToggleWatch() {
    if(this.state.watchEvents) {
      if(this.state.watcher) {
        clearTimeout(this.state.watcher);
      }
    } else {
      this.Watch();
    }

    this.setState({
      watchEvents: !this.state.watchEvents
    });
  }

  async UpdateBlockNumbers() {
    const n = this.props.events.length;
    const latestBlock = n > 0 ? this.props.events[0][0].blockNumber : 0;
    let earliestBlock = this.state.earliestBlock;
    if(this.props.contractAddress) {
      earliestBlock = 0;
    } else if(n > 0) {
      earliestBlock = this.props.events[n - 1][0].blockNumber;
    }

    if(this.state.latestBlock !== latestBlock || this.state.earliestBlock !== earliestBlock) {
      await new Promise((resolve) => {
        this.setState({
          latestBlock,
          earliestBlock,
          toBlock: latestBlock,
          fromBlock: earliestBlock
        }, resolve);
      });
    }
  }

  async RequestEvents() {
    await this.UpdateBlockNumbers();

    if(this.props.contractAddress && this.props.events.length === 0) {
      // On initial request of contract events, get all events starting from block 0
      this.props.RequestMethod({
        contractAddress: this.props.contractAddress,
        abi: this.props.abi,
        fromBlock: 0
      });
    } else {
      this.props.RequestMethod({
        contractAddress: this.props.contractAddress,
        abi: this.props.abi,
        fromBlock: this.state.latestBlock && (this.state.latestBlock + 1)
      });
    }
  }

  async FilterEvents() {
    // Stop watching events
    if(this.state.watchEvents) { this.ToggleWatch(); }

    await this.props.ClearMethod({contractAddress: this.props.contractAddress});

    await this.props.RequestMethod({
      contractAddress: this.props.contractAddress,
      abi: this.props.abi,
      toBlock: this.state.toBlock,
      fromBlock: this.state.fromBlock
    });

    this.setState({scrollToBottom: false});
  }

  async LoadMoreEvents() {
    await this.UpdateBlockNumbers();

    await this.props.RequestMethod({
      contractAddress: this.props.contractAddress,
      abi: this.props.abi,
      toBlock: this.state.earliestBlock - 1,
      fromBlock: this.state.earliestBlock - 10
    });

    this.setState({scrollToBottom: true});
  }

  LoadMoreEventsButton() {
    if(this.state.contractAddress || this.state.earliestBlock <= 0 || this.props.events.length === 0) { return null; }

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
    const watchIconTitle = this.state.watchEvents ? "Stop Watching Events" : "Watch Events";
    const watchIconClassname = this.state.watchEvents ? "watch-icon watching" : "watch-icon";

    return (
      <div className="event-controls">
        <div className="controls">
          <label htmlFor="fromBlock">From</label>
          <input type="number" name="fromBlock" value={this.state.fromBlock} onChange={this.HandleInputChange} />

          <label htmlFor="toBlock">To</label>
          <input type="number" name="toBlock" value={this.state.toBlock} onChange={this.HandleInputChange} />

          <LoadingElement loading={this.Loading()} loadingIcon="rotate">
            <Action onClick={this.FilterEvents}>
              Update
            </Action>
          </LoadingElement>
        </div>
        <div className="controls">
          <input
            name="filterInput"
            value={this.state.filterInput}
            onChange={this.HandleFilterChange}
            placeholder="Filter"
          />
          <IconButton className={watchIconClassname} icon={watchIcon} title={watchIconTitle} onClick={this.ToggleWatch}/>
        </div>
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
  loading: PropTypes.bool.isRequired,
  contractAddress: PropTypes.string,
  abi: PropTypes.array
};

export default Events;
