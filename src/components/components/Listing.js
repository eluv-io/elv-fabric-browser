import React from "react";
import PropTypes from "prop-types";
import {Action, LoadingElement, IconButton} from "elv-components-js";
import GridIcon from "../../static/icons/grid.svg";
import ListIcon from "../../static/icons/list.svg";
import RefreshIcon from "../../static/icons/refresh.svg";
import ListingView from "./ListingView";
import {CancelableEvents, isCancelledPromiseError} from "browser-cancelable-events";
import {inject, observer} from "mobx-react";

let ListingOptions = {};

@inject("libraryStore")
@observer
class Listing extends React.Component {

  // Include intent when calling provided load method
  static ACTIONS = {
    initial: "INITIAL",
    page: "PAGE_CHANGE",
    filter: "FILTER",
    reload: "RELOAD"
  };

  constructor(props) {
    super(props);

    // Load saved settings
    const savedOptions = ListingOptions[props.pageId] || {display: "list", perPage: 10};
    ListingOptions[props.pageId] = savedOptions;

    this.state = {
      display: savedOptions.display,
      perPage: savedOptions.perPage,
      page: props.page || 1,
      selectFilter: this.props.selectFilterOptions ? savedOptions.filter || this.props.selectFilterOptions[0][1] : "",
      filter: props.filter || "",
      filterTimeout: undefined,
      status: {
        loading: true,
        error: ""
      }
    };

    this.Load = this.Load.bind(this);
    this.Filter = this.Filter.bind(this);
    this.ChangeSelectFilter = this.ChangeSelectFilter.bind(this);
  }

  componentDidMount() {
    this.Load(Listing.ACTIONS.initial);
  }

  componentWillUnmount() {
    if(this.cancelable) {
      this.cancelable.cancelAll();
    }
  }

  async Load(action) {
    this.setState({
      status: {
        loading: true,
        error: ""
      }
    });

    try {
      if(this.cancelable) {
        this.cancelable.cancelAll();
      }

      this.cancelable = new CancelableEvents();

      await this.props.LoadContent({
        action,
        params: {
          paginate: true,
          page: this.state.page,
          perPage: this.state.perPage,
          filter: this.state.filter,
          selectFilter: this.state.selectFilter,
          cancelable: this.cancelable
        }
      });

      this.setState({
        status: {
          loading: false,
          error: ""
        }
      });
    } catch(error) {
      if(isCancelledPromiseError(error)) { return; }

      this.setState({
        status: {
          loading: false,
          error: error.message
        }
      });
    }
  }

  SwitchView(view) {
    // Save preferred view
    ListingOptions[this.props.pageId].display = view;

    this.setState({
      display: view
    });
  }

  ChangePage(page) {
    this.setState({
      page
    }, () => this.Load(Listing.ACTIONS.page));
  }

  ChangeSelectFilter(event) {
    // Save selected filter
    ListingOptions[this.props.pageId].filter = event.target.value;

    this.setState({
      page: 1,
      selectFilter: event.target.value,
    }, () => this.Load(Listing.ACTIONS.filter));
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
      filterTimeout: setTimeout(() => this.Load(Listing.ACTIONS.filter), 500)
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
        value={this.state.selectFilter}
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
      this.PageButton("Previous Page", "Prev", this.state.page - 1, disabled)
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

  PerPageControls() {
    return (
      <select
        className="per-page-controls"
        disabled={this.state.status.loading}
        value={this.state.perPage}
        onChange={(event) => {
          const perPage = parseInt(event.target.value);
          this.setState({
            page: 1,
            perPage
          }, () => this.Load(Listing.ACTIONS.page));

          ListingOptions[this.props.pageId].perPage = perPage;
        }}
      >
        <option value={5}>5</option>
        <option value={10}>10</option>
        <option value={20}>20</option>
        <option value={50}>50</option>
        <option value={100}>100</option>
      </select>
    );
  }

  Actions() {
    let switchViewButton;
    // No point in offering grid view if there is no icon
    if(!this.props.noIcon) {
      if(this.state.display === "list") {
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
          { this.PerPageControls() }
        </div>
        <div className="controls right-controls">
          <input className="filter" placeholder="Filter" value={this.state.filter} onChange={this.Filter} />
          { this.SelectFilter() }
          { switchViewButton }
          <LoadingElement loadingClassname="loading-action" loading={this.state.status.loading} loadingIcon="rotate" >
            <IconButton
              className="listing-action"
              icon={RefreshIcon}
              label="Refresh"
              onClick={() => this.Load(Listing.ACTIONS.reload)}
            />
          </LoadingElement>
        </div>
      </div>
    );
  }

  Count() {
    if(this.props.count === 0) {
      return (
        <div className="listing-count listing-empty">
          No results to display
        </div>
      );
    } else if(!this.props.count) {
      return null;
    }

    const start = ((this.state.page - 1) * this.state.perPage) + 1;
    const end = Math.min(start + this.state.perPage - 1, this.props.count);
    return (
      <div className="listing-count">
        {`Displaying results ${start} - ${end} of ${this.props.count}`}
      </div>
    );
  }

  render() {
    if(this.state.status.error) {
      return (
        <div className="error-page">
          <div>There was a problem loading this page:</div>
          <div className="error-message">{this.state.status.error}</div>
          <LoadingElement loading={this.state.status.loading} loadingIcon="rotate">
            <Action onClick={() => this.Load(Listing.ACTIONS.reload)}>Try Again</Action>
          </LoadingElement>
        </div>
      );
    }

    return (
      <div key={`listing-${this.props.pageId}`} className={`listing ${this.props.className || ""}`}>
        <LoadingElement loading={this.state.status.loading} loadingClassname="loading" loadingIcon="rotate">
          { this.Actions() }
          { this.Count() }
          <ListingView
            count={this.props.count}
            display={this.state.display}
            noIcon={this.props.noIcon}
            noStatus={this.props.noStatus}
            noLink={this.props.noLink}
            RenderContent={this.props.RenderContent}
          />
        </LoadingElement>
      </div>
    );
  }
}

Listing.propTypes = {
  pageId: PropTypes.string.isRequired,
  className: PropTypes.string,
  noIcon: PropTypes.bool,
  noStatus: PropTypes.bool,
  noLink: PropTypes.bool,
  paginate: PropTypes.bool,
  page: PropTypes.number,
  filter: PropTypes.string,
  count: PropTypes.number,
  selectFilterLabel: PropTypes.string,
  selectFilterOptions: PropTypes.arrayOf(PropTypes.arrayOf(PropTypes.string)),
  RenderContent: PropTypes.func.isRequired,
  LoadContent: PropTypes.func.isRequired
};

export default Listing;
