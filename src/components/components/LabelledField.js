import React from "react";

export const LabelledField = ({label, value}) => {
  if(typeof label === "string") {
    label = label + ":";
  }

  return (
    <div className="labelled-field">
      <label htmlFor={label}>{ label }</label>
      <div name={label}>{ value }</div>
    </div>
  );
};
