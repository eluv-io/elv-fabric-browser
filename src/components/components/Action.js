import React from "react";
import PropTypes from "prop-types";
import Link from "react-router-dom/es/Link";

const Action = ({title, type, to, onClick, className, children}) => {
  const text = children;

  if(!title) { title = text; }
  if(!type) { type = "button"; }

  if(type === "link") {
    // Link
    // TODO: Make link open in core if in frame
    return (
      <Link
        to={to}
        title={title}
        tabIndex={0}
        className={`action ${className}`}
      >
        { text }
      </Link>
    );
  } else {
    // Button
    return (
      <button
        title={title}
        tabIndex={0}
        type={type}
        className={`action ${className}`}
        onClick={onClick}
      >
        { text }
      </button>
    );
  }
};

Action.propTypes = {
  children: PropTypes.string.isRequired,
  title: PropTypes.string,
  type: PropTypes.string,
  to: PropTypes.string,
  onClick: PropTypes.func,
  className: PropTypes.string
};

export default Action;
