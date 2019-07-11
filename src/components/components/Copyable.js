import React from "react";
import PropTypes from "prop-types";
import {Copy, ImageIcon} from "elv-components-js";
import CopyIcon from "../../static/icons/clipboard.svg";

export const Copyable = ({copy, children}) => {
  return (
    <span className="copyable">
      { children }
      <Copy copy={copy || children}>
        <ImageIcon className="copy-icon" icon={CopyIcon} />
      </Copy>
    </span>
  );
};

Copyable.propTypes = {
  copy: PropTypes.string.isRequired,
  children: PropTypes.oneOfType([
    PropTypes.node,
    PropTypes.string
  ]).isRequired
};
