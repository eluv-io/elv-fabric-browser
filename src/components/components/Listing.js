import React from "react";
import PropTypes from "prop-types";

import RefreshIcon from "../../static/icons/refresh.svg";
import ListIcon from "../../static/icons/list.svg";
import GridIcon from "../../static/icons/grid.svg";
import {CroppedIcon, IconButton} from "./Icons";
import Redirect from "react-router/es/Redirect";
import Link from "react-router-dom/es/Link";

class ListingItem extends React.Component {
  constructor(props) {
    super(props);

    this.state = {};
  }

  Redirect(to) {
    this.setState({
      redirect: to
    });
  }

  AsTableRow() {
    const onClick = () => this.Redirect(this.props.link);

    let iconCell;
    if(!this.props.noIcon) {
      iconCell = (
        <td className="icon-cell">
          <CroppedIcon containerClassname="icon-container" className="dark" icon={this.props.icon}/>
        </td>
      );
    }

    return (
      <tr onClick={onClick} onKeyPress={onClick} tabIndex={0} title={this.props.title}>
        {iconCell}
        <td className="title-cell" title={this.props.title} tabIndex={0}>
          {this.props.title}
        </td>
        <td className="description-cell" title={this.props.description} tabIndex={0}>
          <div className="description-text">
            {this.props.description}
          </div>
        </td>
        <td className="status-cell" title={this.props.status} tabIndex={0}>
          {this.props.status}
        </td>
      </tr>
    );
  }

  AsGridElement() {
    return (
      <Link to={this.props.link} title={this.props.title}>
        <div className="grid-listing-element">
          <CroppedIcon containerClassname="icon-container" className="dark" icon={this.props.icon}/>
          <div className="title">
            {this.props.title}
          </div>
          <div className="description">
            {this.props.description}
          </div>
          <div className="status">
            {this.props.status}
          </div>
        </div>
      </Link>
    );
  }

  render() {
    if(this.state.redirect) {
      return <Redirect to={this.state.redirect} />;
    }

    if(this.props.display === "list") {
      return this.AsTableRow();
    } else {
      return this.AsGridElement();
    }
  }
}

ListingItem.propTypes = {
  id: PropTypes.string.isRequired,
  title: PropTypes.string.isRequired,
  description: PropTypes.string,
  status: PropTypes.string,
  icon: PropTypes.oneOfType([PropTypes.element, PropTypes.string]),
  link: PropTypes.string.isRequired,
  noIcon: PropTypes.bool
};

let ListingOptions = {};

class Listing extends React.Component {
  constructor(props) {
    super(props);

    // Load last used view
    const savedOptions = ListingOptions[props.pageId] || {};

    this.state = {
      display: savedOptions.display || "list",
      filter: "",
    };

    this.Filter = this.Filter.bind(this);
  }

  Filter(event) {
    this.setState({
      filter: event.target.value
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

  ActionBar() {
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
        <input className="filter" placeholder="Filter" value={this.state.filter} onChange={this.Filter} />
        { switchViewButton }
        <IconButton src={RefreshIcon} title="Refresh" onClick={() => {/* TODO */}}/>
      </div>
    );
  }

  Content() {
    if(this.props.content.length === 0) {
      return <h4>No Content Available</h4>;
    }

    let iconHeader;
    if(!this.props.noIcon) {
      iconHeader = <th className="icon-header" />;
    }

    if(this.state.display === "list") {
      return (
        <table>
          <thead>
            <tr>
              { iconHeader }
              <th className="title-header" />
              <th className="description-header" />
              <th className="status-header" />
            </tr>
          </thead>
          <tbody>
            { this.props.content.map(item =>
              <ListingItem key={item.id} noIcon={this.props.noIcon} display={"list"} {...item} />)}
          </tbody>
        </table>
      );
    } else {
      return (
        <div className="grid-listing">
          { this.props.content.map(item =>
            <ListingItem key={item.id} noIcon={this.props.noIcon} display={"grid"} {...item} />)}
        </div>
      );
    }
  }

  render() {
    return (
      <div className="listing">
        { this.ActionBar() }
        { this.Content() }
      </div>
    );
  }
}

Listing.propTypes = {
  pageId: PropTypes.string.isRequired,
  content: PropTypes.arrayOf(PropTypes.object).isRequired,
  noIcon: PropTypes.bool
};

export default Listing;
