import React from "react";
import PropTypes from "prop-types";
import {CroppedIcon} from "elv-components-js";
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
    return (
      <RedirectElement to={this.props.link}>
        <tr title={this.props.title} aria-label={this.props.title} className={this.props.link ? "listing-link" : ""}>
          <td className="icon-cell" hidden={this.props.noIcon}>
            <CroppedIcon className="icon-container" icon={this.props.icon}/>
          </td>
          <td className="title-cell" title={this.props.title}>
            <div className="cropped-text" tabIndex={-1}>
              {this.props.title}
            </div>
          </td>
          <td className="description-cell" title={this.props.description}>
            <div className="cropped-text" tabIndex={-1}>
              {this.props.description}
            </div>
          </td>
          <td className="status-cell" title={this.props.status} hidden={this.props.noStatus}>
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
        <table>
          <thead>
            <tr>
              <th className="icon-header" hidden={this.props.noIcon} />
              <th className="title-header" />
              <th className="description-header" />
              <th className="status-header" hidden={this.props.noStatus} />
            </tr>
          </thead>
          <tbody>
            { content.map(item =>
              <ListingItem
                key={item.id}
                display={"list"}
                noIcon={this.props.noIcon}
                noStatus={this.props.noStatus}
                {...item}
              />)}
          </tbody>
        </table>
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
