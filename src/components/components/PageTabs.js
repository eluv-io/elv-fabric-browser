import React from "react";
import PropTypes from "prop-types";
import Action from "./Action";

const PageTabs = ({options, selected, onChange, className=""}) => {
  const tabs = options.map(([label, value]) => {
    return (
      <Action
        className={
          "action action-compact action-wide action-inline " +
          (selected === value ? "tertiary" : "secondary")
        }
        onClick={() => onChange(value)}
        key={"tab-" + value}
      >
        { label }
      </Action>
    );
  });

  return (
    <div className={"actions-container tab-container " + className}>
      { tabs }
    </div>
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
