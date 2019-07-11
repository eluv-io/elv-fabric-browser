import React from "react";
import {Copyable} from "./Copyable";

export const LabelledField = ({label, value, children, copyValue, alignTop=false, wideLabel=false, hidden=false}) => {
  if(typeof label === "string" && label.length > 0) {
    label = label + ":";
  }

  const labelClass = (wideLabel ? "wide" : "") + (alignTop ? "align-top" : "");

  let content = <div aria-label={label} title={value}>{ children || value }</div>;
  if(copyValue) {
    content = <Copyable copy={copyValue}>{ content }</Copyable>;
  }

  return (
    <div className={"labelled-field" + (hidden ? " hidden" : "")}>
      <label htmlFor={label} className={labelClass}>{ label }</label>
      { content }
    </div>
  );
};
