import React from "react";
import PropTypes from "prop-types";
import {ImageIcon} from "elv-components-js";
import {Redirect} from "react-router";
import {Link} from "react-router-dom";
import {observer} from "mobx-react";
import Fabric from "../../clients/Fabric";

const IMAGE_HEIGHT = 300;

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
      <div key={`listing-title-${this.props.id}`} title={this.props.title}>
        <div className="title cropped-text" tabIndex={-1}>
          {this.props.title}
        </div>
      </div>,
      <div key={`listing-description-${this.props.id}`} title={this.props.description}>
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
        <div
          key={`listing-icon-${this.props.id}`}
          hidden={this.props.noIcon}
          className={`icon-container ${isSVG ? "svg-icon-container" : ""}`}
        >
          <ImageIcon icon={Fabric.utils.ResizeImage({imageUrl: this.props.icon, height: IMAGE_HEIGHT})} />
        </div>
      );
    }

    if(this.props.noStatus) {
      className += " listing-row-no-status";
    } else {
      elements.push(
        <div
          key={`listing-status-${this.props.id}`}
          className="status"
          title={(this.props.status || "").toString()}
          hidden={this.props.noStatus}
        >
          {this.props.status}
        </div>
      );
    }

    if(this.props.link) {
      return (
        <Link
          title={this.props.title}
          to={this.props.link}
          aria-label={this.props.title}
          className={className}
        >
          { elements }
        </Link>
      );
    } else {
      return (
        <div title={this.props.title} aria-label={this.props.title} className={className}>
          { elements }
        </div>
      );
    }
  }

  AsGridElement() {
    const isSVG = typeof this.props.icon === "string" && this.props.icon.startsWith("<svg");
    const elements = (
      <React.Fragment>
        <div className={`icon-container ${isSVG ? "svg-icon-container" : ""}`}>
          <ImageIcon icon={Fabric.utils.ResizeImage({imageUrl: this.props.icon, height: IMAGE_HEIGHT})} />
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
      </React.Fragment>
    );

    if(this.props.link) {
      return (
        <Link
          title={this.props.title}
          to={this.props.link}
          aria-label={this.props.title}
        >
          { elements }
        </Link>
      );
    } else {
      return (
        <div title={this.props.title} aria-label={this.props.title} className={className}>
          { elements }
        </div>
      );
    }
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
