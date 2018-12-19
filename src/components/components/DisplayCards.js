import React from "react";
import PropTypes from "prop-types";
import { Link } from "react-router-dom";
import { ImageIcon } from "./Icons";
import ClippedText from "./ClippedText";
import OwnerIcon from "../../static/icons/owner.svg";

export const ThreeCard = ({link, icon, name, description, title}) => {
  return (
    <Link
      to={link}
      className="display-card three-card "
      title={title}
    >
      <ImageIcon className="card-icon" icon={icon} />
      <div className="card-name">
        {name}
      </div>
      <div className="card-description">
        {description}
      </div>
    </Link>
  );
};

ThreeCard.propTypes = {
  link: PropTypes.string,
  icon: PropTypes.string,
  name: PropTypes.string.isRequired,
  description: PropTypes.string,
  title: PropTypes.string
};

export const SmallCard = ({className, link, name, description, title}) => {
  return (
    <div className={"display-card small-card" + (className || "")} title={title} >
      <div className="card-header">
        <Link className="card-name" to={link}>
          {name}
        </Link>
      </div>
      <ClippedText text={description || "No description"} className="card-description" />
    </div>
  );
};

SmallCard.propTypes = {
  className: PropTypes.string,
  link: PropTypes.string,
  name: PropTypes.string.isRequired,
  description: PropTypes.string,
  title: PropTypes.string,
};

export class LibraryCard extends React.Component {
  render() {
    const ownerIcon = this.props.isOwner ? <ImageIcon className="header-icon" title={"Owner"} icon={OwnerIcon} /> : null;

    return (
      <div className="display-card library-card" title={this.props.title}>
        <Link to={this.props.link} className="image-container">
          <div className="cropped-image">
            <ImageIcon className="library-image card-icon" icon={this.props.icon}/>
          </div>
        </Link>
        <div className="info-container">
          <div className="header">
            <Link to={this.props.link} className="name">{this.props.name}</Link>
            { ownerIcon }
          </div>
          <div className="info">
            {this.props.infoText}
          </div>
          <ClippedText text={this.props.description} className="description" />
        </div>
      </div>
    );
  }
}

LibraryCard.propTypes = {
  libraryId: PropTypes.string,
  link: PropTypes.string,
  icon: PropTypes.string,
  name: PropTypes.string.isRequired,
  isOwner: PropTypes.bool,
  infoText: PropTypes.string,
  description: PropTypes.string,
  title: PropTypes.string
};
