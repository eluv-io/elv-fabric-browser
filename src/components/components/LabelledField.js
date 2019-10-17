import React from "react";
import {Copyable} from "./Copyable";
import {EditableField} from "elv-components-js";

export const LabelledField = ({
  label,
  value,
  children,
  copyValue,
  editable=false,
  type="input",
  onChange,
  alignTop=false,
  wideLabel=false,
  hidden=false
}) => {
  if(typeof label === "string" && label.length > 0) {
    label = label + ":";
  }

  const labelClass = (wideLabel ? "wide" : "") + (alignTop || type === "textarea" ? "align-top" : "");

  let content = <div aria-label={label} title={value}>{ children || value }</div>;
  if(copyValue) {
    content = <Copyable copy={copyValue}>{ content }</Copyable>;
  } else if(editable) {
    content = (
      <EditableField
        value={ children || value }
        type={type}
        onChange={onChange}
        truncate={type === "textarea"}
        lines={3}
        className="editable-field"
        editClassName="editing-field"
      />
    );
  }

  return (
    <div className={"labelled-field" + (hidden ? " hidden" : "")}>
      <label htmlFor={label} className={labelClass}>{ label }</label>
      { content }
    </div>
  );
};
