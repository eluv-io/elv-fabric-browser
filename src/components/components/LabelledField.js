import React from "react";

export const LabelledField = ({label, value, alignTop=false, wideLabel=false, hidden=false}) => {
  if(typeof label === "string" && label.length > 0) {
    label = label + ":";
  }

  const labelClass = (wideLabel ? "wide" : "") + (alignTop ? "align-top" : "");

  return (
    <div className={"labelled-field" + (hidden ? " hidden" : "")}>
      <label htmlFor={label} className={labelClass}>{ label }</label>
      <div aria-label={label} title={value}>{ value }</div>
    </div>
  );
};
