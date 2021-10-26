import React, {useEffect, useRef, useState} from "react";
import {LabelledField} from "./LabelledField";
import {Action} from "elv-components-js";

const ToggleSection = React.forwardRef(({label, children, className="", toggleOpen=false}) => {
  const [show, setShow] = useState(toggleOpen);
  const ref = useRef(null);

  useEffect(() => {
    if(toggleOpen && ref.current) {
      ref.current.scrollIntoView(true);
    }
  }, []);

  return (
    <div className={`formatted-data ${className || ""}`}>
      <LabelledField label={label}>
        <Action className={"action-compact action-wide " + (show ? "" : "secondary")} onClick={() => setShow(!show)}>
          { `${show ? "Hide" : "Show"} ${label}` }
        </Action>
      </LabelledField>
      <div className="children-wrapper" ref={ref}>
        { show ? children : null }
      </div>
    </div>
  );
});

export default ToggleSection;
