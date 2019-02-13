import React from "react";
import PropTypes from "prop-types";
import {IconButton} from "./Icons";
import GridIcon from "../../static/icons/grid.svg";
import ListIcon from "../../static/icons/list.svg";
import RequestElement from "./RequestElement";
import RefreshIcon from "../../static/icons/refresh.svg";
import ListingView from "./ListingView";
import Action from "./Action";

let ListingOptions = {};

class Listing extends React.Component {
  constructor(props) {
    super(props);

    // Load last used view
    const savedOptions = ListingOptions[props.pageId] || {};

    this.state = {
      display: savedOptions.display || "list",
      perPage: 1,
      page: 10,
      filter: "",
      filterTimeout: undefined
    };

    this.Load = this.Load.bind(this);
    this.Filter = this.Filter.bind(this);
  }

  componentDidMount() {
    this.Load();
  }

  Load() {
    this.setState({
      requestId: this.props.WrapRequest({
        todo: async () => {
          await this.props.LoadContent({
            params: {
              page: this.state.page,
              perPage: this.state.perPage,
              filter: this.state.filter
            }
          });
        }
      })
    });
  }

  SwitchView(view) {
    // Save preferred view
    ListingOptions[this.props.pageId] = {
      display: view
    };

    this.setState({
      display: view
    });
  }

  ChangePage(page) {
    this.setState({
      page
    }, this.Load);
  }

  // Debounced filter
  Filter(event) {
    const value = event.target.value;

    if(this.state.filterTimeout) {
      clearTimeout(this.state.filterTimeout);
    }

    this.setState({
      filter: value,
      filterTimeout: setTimeout(this.Load, 500)
    });
  }

  PageButton(title, text, page, disabled) {
    const isTextButton = text !== page;

    return (
      <li key={title}>
        <Action
          title={"Page " + page}
          onClick={() => this.ChangePage(page)}
          disabled={disabled}
          className={`page-button ${isTextButton ? "text-button" : ""}`}
        >
          {text.toString()}
        </Action>
      </li>
    );
  }

  PageSpread() {
    if(!this.props.count) { return; }

    const totalPages = Math.ceil(this.props.count / this.state.perPage);
    let start = 1;
    let end = Math.min(10, totalPages);

    if(this.state.page >= 5) {
      start = this.state.page - 4;
      end = start + 9;

      if(end > totalPages) {
        end = totalPages;
        start = Math.max(totalPages - 9, 1);
      }
    }

    const spread = (end - start) + 1;

    return [...Array(spread).keys()].map(i => {
      const page = start + i;
      return this.PageButton("Page " + page, page, page, page === this.state.page);
    });
  }

  PreviousPageButtons() {
    const disabled = this.state.page <= 1;

    return [
      this.PageButton("First Page", "First", 1, disabled),
      this.PageButton("Previous Page", "Previous", this.state.page - 1, disabled)
    ];
  }

  NextPageButtons() {
    const totalPages = Math.ceil(this.props.count / this.state.perPage);
    const disabled = (this.state.page * this.state.perPage) >= this.props.count;

    return [
      this.PageButton("Next Page", "Next", this.state.page + 1, disabled),
      this.PageButton("Last Page", "Last", totalPages, disabled)
    ];
  }

  PaginationControls() {
    if(!this.props.paginate) { return; }

    return (
      <ul className="page-controls">
        { this.PreviousPageButtons() }
        { this.PageSpread() }
        { this.NextPageButtons() }
      </ul>
    );
  }

  Actions() {
    let switchViewButton;
    // No point in offering grid view if there is no icon
    if(!this.props.noIcon) {
      if (this.state.display === "list") {
        switchViewButton =
          <IconButton src={GridIcon} title="Switch to grid view" onClick={() => this.SwitchView("grid")}/>;
      } else {
        switchViewButton =
          <IconButton src={ListIcon} title="Switch to list view" onClick={() => this.SwitchView("list")}/>;
      }
    }

    return (
      <div className="listing-actions">
        <div className="controls">
          { this.PaginationControls() }
        </div>
        <div className="controls">
          <input className="filter" placeholder="Filter" value={this.state.filter} onChange={this.Filter} />
          { switchViewButton }
          <RequestElement requestId={this.state.requestId} requests={this.props.requests} loadingIcon="rotate" >
            <IconButton className="request-icon" src={RefreshIcon} title="Refresh" onClick={this.Load} />
          </RequestElement>
        </div>
      </div>
    );
  }

  render() {
    return (
      <div className="listing">
        { this.Actions() }
        <RequestElement requestId={this.state.requestId} requests={this.props.requests} loadingClassname="loading">
          <ListingView
            display={this.state.display}
            noIcon={this.props.noIcon}
            RenderContent={this.props.RenderContent}
          />
        </RequestElement>
      </div>
    );
  }
}

Listing.propTypes = {
  pageId: PropTypes.string.isRequired,
  noIcon: PropTypes.bool,
  requests: PropTypes.object.isRequired,
  paginate: PropTypes.bool,
  count: PropTypes.number,
  RenderContent: PropTypes.func.isRequired,
  LoadContent: PropTypes.func.isRequired
};

export default Listing;
