import React from "react";
import PropTypes from "prop-types";
import { Link } from "react-router-dom";
import { ImageIcon } from "./Icons";
import ClippedText from "./ClippedText";

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

export const SmallCard = ({className, link, name, description, title, onDelete}) => {
  const handleDelete = (event) => { event.stopPropagation() ; onDelete(); };

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
  onDelete: PropTypes.func
};

export class LibraryCard extends React.Component {
  render() {
    let previews = this.props.previews || [];

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
          </div>
          <div className="info">
            {this.props.infoText}
          </div>
          <ClippedText text={this.props.description} className="description" />
          <div className="preview-container">
            {(previews.slice(0, 6).map(({name, image}, index) => {
              let key = "image-preview-" + this.props.libraryId + "-" + index;
              return (
                <div className="preview" key={key}>
                  <ImageIcon title={name} className="content-preview card-icon" icon={image} />
                </div>
              );
            }))}
          </div>
        </div>
      </div>
    );
  }
}

LibraryCard.propTypes = {
  libraryId: PropTypes.string,
  link: PropTypes.string,
  icon: PropTypes.string,
  previews: PropTypes.array,
  name: PropTypes.string.isRequired,
  infoText: PropTypes.string,
  description: PropTypes.string,
  title: PropTypes.string
};
