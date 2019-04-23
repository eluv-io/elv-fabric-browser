import React from "react";
import PropTypes from "prop-types";
import {Action, LoadingElement, IconButton} from "elv-components-js";
import GridIcon from "../../static/icons/grid.svg";
import ListIcon from "../../static/icons/list.svg";
import RefreshIcon from "../../static/icons/refresh.svg";
import ListingView from "./ListingView";
import {CancelableEvents} from "browser-cancelable-events";

let ListingOptions = {};

class Listing extends React.Component {
  constructor(props) {
    super(props);

    // Load last used view
    const savedOptions = ListingOptions[props.pageId] || {};

    this.state = {
      display: savedOptions.display || "list",
      perPage: 10,
      page: 1,
      selectFilter: this.props.selectFilterOptions ? this.props.selectFilterOptions[0][1] : "",
      filter: "",
      filterTimeout: undefined
    };

    this.Load = this.Load.bind(this);
    this.Filter = this.Filter.bind(this);
    this.ChangeSelectFilter = this.ChangeSelectFilter.bind(this);
  }

  componentDidMount() {
    this.Load();
  }

  Load() {
    if(this.cancelable) {
      this.cancelable.cancelAll();
    }

    this.cancelable = new CancelableEvents();

    this.props.LoadContent({
      params: {
        paginate: true,
        page: this.state.page,
        perPage: this.state.perPage,
        filter: this.state.filter,
        selectFilter: this.state.selectFilter,
        cancelable: this.cancelable
      }
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

  ChangeSelectFilter(event) {
    this.setState({
      page: 1,
      selectFilter: event.target.value,
    }, this.Load);
  }

  // Debounced filter
  Filter(event) {
    const value = event.target.value;

    if(this.state.filterTimeout) {
      clearTimeout(this.state.filterTimeout);
    }

    this.setState({
      page: 1,
      filter: value,
      filterTimeout: setTimeout(this.Load, 500)
    });
  }

  SelectFilter() {
    if(!this.props.selectFilterOptions) { return; }

    const options = this.props.selectFilterOptions.map(([label, value]) =>
      <option key={`select-option-${value}`} value={value}>{label}</option>
    );

    return (
      <select
        name="selectFilter"
        title={this.props.selectFilterLabel}
        aria-label={this.props.selectFilterLabel}
        onChange={this.ChangeSelectFilter}
      >
        {options}
      </select>
    );
  }

  PageButton(title, text, page, disabled) {
    const isTextButton = text !== page;

    return (
      <li key={title}>
        <button
          title={"Page " + page}
          aria-label={"Page " + page}
          onClick={() => this.ChangePage(page)}
          onKeyPress={() => this.ChangePage(page)}
          disabled={disabled}
          className={`page-button ${isTextButton ? "text-button" : ""} ${!isTextButton && disabled ? "selected" : ""}`}
        >
          {text.toString()}
        </button>
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
          <IconButton className="listing-action" icon={GridIcon} label="Switch to grid view" onClick={() => this.SwitchView("grid")}/>;
      } else {
        switchViewButton =
          <IconButton className="listing-action" icon={ListIcon} label="Switch to list view" onClick={() => this.SwitchView("list")}/>;
      }
    }

    return (
      <div className="listing-actions">
        <div className="controls">
          { this.PaginationControls() }
        </div>
        <div className="controls right-controls">
          <input className="filter" placeholder="Filter" value={this.state.filter} onChange={this.Filter} />
          { this.SelectFilter() }
          { switchViewButton }
          <LoadingElement loadingClassname="loading-action" loading={this.props.loadingStatus.loading} loadingIcon="rotate" >
            <IconButton className="listing-action" icon={RefreshIcon} label="Refresh" onClick={this.Load} />
          </LoadingElement>
        </div>
      </div>
    );
  }

  render() {
    if(this.props.loadingStatus.error) {
      return (
        <div className="error-page">
          <div>There was a problem loading this page:</div>
          <div className="error-message">{this.props.loadingStatus.errorMessage}</div>
          <LoadingElement loading={this.props.loadingStatus.loading} loadingIcon="rotate">
            <Action onClick={this.Load}>Try Again</Action>
          </LoadingElement>
        </div>
      );
    }

    return (
      <div className="listing">
        { this.Actions() }
        <LoadingElement loading={this.props.loadingStatus.loading} loadingClassname="loading" loadingIcon="rotate">
          <ListingView
            count={this.props.count}
            display={this.state.display}
            noIcon={this.props.noIcon}
            RenderContent={this.props.RenderContent}
          />
        </LoadingElement>
      </div>
    );
  }
}

Listing.propTypes = {
  pageId: PropTypes.string.isRequired,
  noIcon: PropTypes.bool,
  paginate: PropTypes.bool,
  count: PropTypes.number,
  selectFilterLabel: PropTypes.string,
  selectFilterOptions: PropTypes.arrayOf(PropTypes.arrayOf(PropTypes.string)),
  loadingStatus: PropTypes.object.isRequired,
  RenderContent: PropTypes.func.isRequired,
  LoadContent: PropTypes.func.isRequired
};

export default Listing;
