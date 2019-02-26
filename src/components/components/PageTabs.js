import React from "react";
import PropTypes from "prop-types";

const PageTabs = ({options, selected, onChange, className=""}) => {
  const tabs = options.map(([label, value]) => {
    return (
      <li
        tabIndex={0}
        className={
          "tab " + className +
          (selected === value ? " selected" : "")
        }
        onClick={() => onChange(value)}
        onKeyPress={() => onChange(value)}
        key={"tab-" + value}
      >
        { label }
      </li>
    );
  });

  return (
    <ul className={"tab-container " + className}>
      { tabs }
    </ul>
  );
};

PageTabs.propTypes = {
  options: PropTypes.arrayOf(
    PropTypes.arrayOf(
      PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.bool
      ])
    )).isRequired,
  selected: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.bool
  ]).isRequired,
  onChange: PropTypes.func.isRequired,
  className: PropTypes.string
};

export default PageTabs;
