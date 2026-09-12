import React, {useEffect, useRef, useState} from "react";
import {ImageIcon} from "elv-components-js";

import ChevronIcon from "../../static/icons/chevron-right.svg";

/* Previous implementation, kept for review:

const ToggleSection = ({label, children, className="", toggleOpen=false}) => {
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
};
*/

const ToggleSection = ({label, children, badge, className="", toggleOpen=false}) => {
  const [show, setShow] = useState(toggleOpen);
  const ref = useRef(null);

  useEffect(() => {
    if(toggleOpen && ref.current) {
      ref.current.scrollIntoView(true);
    }
  }, []);

  return (
    <div className={`formatted-data toggle-section ${className || ""}`}>
      <button
        type="button"
        className="toggle-section-header"
        aria-expanded={show}
        onClick={() => setShow(!show)}
      >
        <ImageIcon className="toggle-section-chevron" icon={ChevronIcon} label="" />
        <span className="toggle-section-label">{ label }</span>
        { badge ? <span className="toggle-section-badge">{ badge }</span> : null }
      </button>
      <div className="children-wrapper" ref={ref} hidden={!show}>
        { show ? children : null }
      </div>
    </div>
  );
};

export default ToggleSection;
