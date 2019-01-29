import React from "react";
import PropTypes from "prop-types";

const PageTabs = ({options, selected, onChange}) => {
  const tabs = options.map(([label, value]) => {
    return (
      <button
        className={
          "action action-compact action-wide action-inline " +
          (selected === value ? "tertiary" : "secondary")
        }
        onClick={() => onChange(value)}
        key={"tab-" + value}
      >
        { label }
      </button>
    );
  });

  return (
    <div className="actions-container tab-container">
      { tabs }
    </div>
  );
};

PageTabs.propTypes = {
  options: PropTypes.arrayOf(PropTypes.arrayOf(PropTypes.string)).isRequired,
  selected: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired
};

export default PageTabs;
