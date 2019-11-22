import React, {useState} from "react";
import {LabelledField} from "./LabelledField";
import {Action} from "elv-components-js";

const ToggleSection = ({label, children, className=""}) => {
  const [show, setShow] = useState(false);

  return (
    <div className={`formatted-data ${className || ""}`}>
      <LabelledField label={label}>
        <Action className={"action-compact action-wide " + (show ? "" : "secondary")} onClick={() => setShow(!show)}>
          { `${show ? "Hide" : "Show"} ${label}` }
        </Action>
      </LabelledField>
      { show ? children : null }
    </div>
  );
};

export default ToggleSection;
