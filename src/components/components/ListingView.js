import React from "react";
import PropTypes from "prop-types";
import {CroppedIcon} from "elv-components-js/src/components/Icons";
import Redirect from "react-router/es/Redirect";
import Link from "react-router-dom/es/Link";
import RedirectElement from "./RedirectElement";

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
    let iconCell;
    if(!this.props.noIcon) {
      iconCell = (
        <td className="icon-cell">
          <CroppedIcon className="icon-container" icon={this.props.icon}/>
        </td>
      );
    }

    return (
      <RedirectElement to={this.props.link}>
        <tr title={this.props.title} aria-label={this.props.title}>
          {iconCell}
          <td className="title-cell" title={this.props.title}>
            {this.props.title}
          </td>
          <td className="description-cell" title={this.props.description}>
            <div className="description-text" tabIndex={-1}>
              {this.props.description}
            </div>
          </td>
          <td className="status-cell" title={this.props.status}>
            {this.props.status}
          </td>
        </tr>
      </RedirectElement>
    );
  }

  AsGridElement() {
    return (
      <Link to={this.props.link} title={this.props.title} aria-label={this.props.title} className="grid-listing-element">
        <CroppedIcon className="icon-container" icon={this.props.icon}/>
        <div className="title">
          {this.props.title}
        </div>
        <div className="description">
          {this.props.description}
        </div>
        <div className="status">
          {this.props.status}
        </div>
      </Link>
    );
  }

  render() {
    if(this.state.redirect) {
      return <Redirect push to={this.state.redirect} />;
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

class Listing extends React.Component {
  render() {
    if(!this.props.count || this.props.count === 0) {
      return <h4>No Content Available</h4>;
    }

    const content = this.props.RenderContent();
    if(!content || content.length === 0) {
      return <h4>No Content Available</h4>;
    }

    let iconHeader;
    if(!this.props.noIcon) {
      iconHeader = <th className="icon-header" />;
    }

    if(this.props.display === "list") {
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
            { content.map(item =>
              <ListingItem key={item.id} noIcon={this.props.noIcon} display={"list"} {...item} />)}
          </tbody>
        </table>
      );
    } else {
      return (
        <div className="grid-listing">
          { content.map(item =>
            <ListingItem key={item.id} noIcon={this.props.noIcon} display={"grid"} {...item} />)}
        </div>
      );
    }
  }
}

Listing.propTypes = {
  count: PropTypes.number,
  display: PropTypes.string.isRequired,
  RenderContent: PropTypes.func.isRequired,
  noIcon: PropTypes.bool
};

export default Listing;
