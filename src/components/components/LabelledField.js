import React from "react";

export const LabelledField = ({label, value, wideLabel=false, hidden=false}) => {
  if(typeof label === "string" && label.length > 0) {
    label = label + ":";
  }

  return (
    <div className={"labelled-field" + (hidden ? " hidden" : "")}>
      <label htmlFor={label} className={wideLabel ? "wide" : ""}>{ label }</label>
      <div name={label}>{ value }</div>
    </div>
  );
};
