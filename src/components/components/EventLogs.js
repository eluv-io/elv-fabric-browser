import React from "react";
import EventCard from "./EventCard";
import PropTypes from "prop-types";
import {BallClipRotate} from "./AnimatedIcons";
import Action from "./Action";
import RequestElement from "./RequestElement";

class EventLogs extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      latestBlock: 0,
      earliestBlock: Number.MAX_SAFE_INTEGER,
      fromBlock: 0,
      toBlock: 0,
      watchEvents: false,
      watcher: undefined
    };

    this.FilterEvents = this.FilterEvents.bind(this);
    this.HandleInputChange = this.HandleInputChange.bind(this);
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

  HandleInputChange(event) {
    this.setState({
      [event.target.name]: parseInt(event.target.value)
    });
  }

  Watch() {
    this.setState({
      watcher: setTimeout(async () => {
        await this.RequestEvents();

        this.Watch();
      }, 5000)
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
  }

  async LoadMoreEvents() {
    await this.UpdateBlockNumbers();

    await this.props.RequestMethod({
      contractAddress: this.props.contractAddress,
      abi: this.props.abi,
      toBlock: this.state.earliestBlock - 1,
      fromBlock: this.state.earliestBlock - 10
    });
  }

  LoadMoreEventsButton() {
    if(this.state.contractAddress || this.state.earliestBlock <= 0 || this.props.events.length === 0) { return null; }

    return (
      <div className="actions-container full-width centered">
        <RequestElement loading={this.props.loading}>
          <Action onClick={this.LoadMoreEvents}>
            Load More Events
          </Action>
        </RequestElement>
      </div>
    );
  }

  FilterForm() {
    const watchButtonText = this.state.watchEvents ? "Stop Watching" : "Start Watching";

    return (
      <div className="events-controls">
        <form className="form-container event-actions-container">
          <div className="labelled-input">
            <label htmlFor="toBlock">To Block</label>
            <input type="number" name="toBlock" value={this.state.toBlock} onChange={this.HandleInputChange} />
          </div>
          <div className="labelled-input">
            <label htmlFor="fromBlock">From Block</label>
            <input type="number" name="fromBlock" value={this.state.fromBlock} onChange={this.HandleInputChange} />
          </div>
          <div className="actions-container">
            <RequestElement loading={this.props.loading && !this.state.watchEvents} loadingIcon="rotate">
              <Action onClick={this.FilterEvents}>
                Filter Events
              </Action>
            </RequestElement>
          </div>
        </form>
        <div className="actions-container">
          <Action className="action action-wide" onClick={this.ToggleWatch}>{watchButtonText}</Action>
        </div>
      </div>
    );
  }

  Events() {
    if(this.props.events.length === 0) { return <h4>No events found</h4>; }

    return this.props.events.map(block => {
      return <EventCard events={block} key={"block-" + block[0].blockNumber} />;
    });
  }

  render() {
    const watchIcon = this.state.watchEvents ? <BallClipRotate /> : null;

    return (
      <div className="events">
        <h3 className="header-with-loader">
          Event Logs
          { watchIcon }
        </h3>
        { this.FilterForm() }
        <div className="events-container">
          { this.Events() }
        </div>
        { this.LoadMoreEventsButton() }
      </div>
    );
  }
}

EventLogs.propTypes = {
  events: PropTypes.arrayOf(PropTypes.arrayOf(PropTypes.object)).isRequired,
  RequestMethod: PropTypes.func.isRequired,
  ClearMethod: PropTypes.func.isRequired,
  loading: PropTypes.bool.isRequired,
  contractAddress: PropTypes.string,
  abi: PropTypes.array
};

export default EventLogs;
