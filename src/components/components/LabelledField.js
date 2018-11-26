import React from "react";

export const LabelledField = ({label, value, wideLabel=false}) => {
  if(typeof label === "string") {
    label = label + ":";
  }

  return (
    <div className="labelled-field">
      <label htmlFor={label} className={wideLabel ? "wide" : ""}>{ label }</label>
      <div name={label}>{ value }</div>
    </div>
  );
};
