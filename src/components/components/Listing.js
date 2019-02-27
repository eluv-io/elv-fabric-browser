import React from "react";
import PropTypes from "prop-types";
import {IconButton} from "elv-components-js/src/components/Icons";
import GridIcon from "../../static/icons/grid.svg";
import ListIcon from "../../static/icons/list.svg";
import LoadingElement from "elv-components-js/src/components/LoadingElement";
import RefreshIcon from "../../static/icons/refresh.svg";
import ListingView from "./ListingView";
import Action from "elv-components-js/src/components/Action";

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
    this.props.LoadContent({
      params: {
        paginate: true,
        page: this.state.page,
        perPage: this.state.perPage,
        filter: this.state.filter
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

  PageButton(title, text, page, disabled) {
    const isTextButton = text !== page;

    return (
      <li key={title}>
        <button
          title={"Page " + page}
          onClick={() => this.ChangePage(page)}
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
          <IconButton className="listing-action" icon={GridIcon} title="Switch to grid view" onClick={() => this.SwitchView("grid")}/>;
      } else {
        switchViewButton =
          <IconButton className="listing-action" icon={ListIcon} title="Switch to list view" onClick={() => this.SwitchView("list")}/>;
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
          <LoadingElement loadingClassname="loading-action" loading={this.props.loadingStatus.loading} loadingIcon="rotate" >
            <IconButton className="listing-action" icon={RefreshIcon} title="Refresh" onClick={this.Load} />
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
        <LoadingElement loading={this.props.loadingStatus.loading} loadingClassname="loading">
          <ListingView
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
  loadingStatus: PropTypes.object.isRequired,
  RenderContent: PropTypes.func.isRequired,
  LoadContent: PropTypes.func.isRequired
};

export default Listing;
