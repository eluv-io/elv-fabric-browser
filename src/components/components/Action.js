import React from "react";
import PropTypes from "prop-types";
import Link from "react-router-dom/es/Link";

const Action = ({title, type, to, onClick, className, disabled=false, children}) => {
  className = className || "";

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
        className={`elv-button ${className}`}
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
        className={`elv-button ${className}`}
        onClick={onClick}
        disabled={disabled}
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
  className: PropTypes.string,
  disabled: PropTypes.bool
};

export default Action;
