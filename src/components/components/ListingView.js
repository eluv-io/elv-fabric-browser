import React from "react";
import PropTypes from "prop-types";
import {ImageIcon} from "elv-components-js";
import {Redirect} from "react-router";
import {Link} from "react-router-dom";
import RedirectElement from "./RedirectElement";
import {observer} from "mobx-react";

@observer
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
    let className = "listing-row";
    let elements = [
      <div title={this.props.title}>
        <div className="title cropped-text" tabIndex={-1}>
          {this.props.title}
        </div>
      </div>,
      <div title={this.props.description}>
        <div className="description cropped-text" tabIndex={-1}>
          {this.props.description}
        </div>
      </div>
    ];

    if(this.props.noIcon) {
      className += " listing-row-no-icon";
    } else {
      const isSVG = typeof this.props.icon === "string" && this.props.icon.startsWith("<svg");

      elements.unshift(
        <div hidden={this.props.noIcon} className={`icon-container ${isSVG ? "svg-icon-container" : ""}`}>
          <ImageIcon icon={this.props.icon}/>
        </div>
      );
    }

    if(this.props.noStatus) {
      className += " listing-row-no-status";
    } else {
      elements.push(
        <div className="status" title={this.props.status} hidden={this.props.noStatus}>
          {this.props.status}
        </div>
      );
    }

    return (
      <RedirectElement to={this.props.link}>
        <div
          aria-label={this.props.title}
          className={className}
        >
          { elements }
        </div>
      </RedirectElement>
    );
  }

  AsGridElement() {
    const isSVG = typeof this.props.icon === "string" && this.props.icon.startsWith("<svg");
    return (
      <Link to={this.props.link} title={this.props.title} aria-label={this.props.title} className="grid-listing-element">
        <div className={`icon-container ${isSVG ? "svg-icon-container" : ""}`}>
          <ImageIcon icon={this.props.icon} />
        </div>

        <div className="listing-info">
          <div className="title">
            {this.props.title}
          </div>
          <div className="description" title={this.props.description}>
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
  status: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.node
  ]),
  icon: PropTypes.oneOfType([PropTypes.element, PropTypes.string]),
  link: PropTypes.string,
  noIcon: PropTypes.bool
};

@observer
class Listing extends React.Component {
  render() {
    if(!this.props.count || this.props.count === 0) {
      return null;
    }

    const content = this.props.RenderContent();
    if(!content || content.length === 0) {
      return null;
    }

    if(this.props.display === "list") {
      return (
        <div className="table-listing">
          { content.map(item =>
            <ListingItem
              key={item.id}
              display={"list"}
              noIcon={this.props.noIcon}
              noStatus={this.props.noStatus}
              {...item}
            />
          )}
        </div>
      );
    } else {
      return (
        <div className="grid-listing">
          { content.map(item =>
            <ListingItem
              key={item.id}
              display={"grid"}
              noIcon={this.props.noIcon}
              noStatus={this.props.noStatus}
              {...item}
            />)}
        </div>
      );
    }
  }
}

Listing.propTypes = {
  count: PropTypes.number,
  display: PropTypes.string.isRequired,
  RenderContent: PropTypes.func.isRequired,
  noIcon: PropTypes.bool,
  noStatus: PropTypes.bool
};

export default Listing;
