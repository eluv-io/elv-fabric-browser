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

Previously rendered an Action. The open state filled solid blue, the treatment reserved for primary actions, and
nothing tied the revealed content to the trigger. There was no aria-expanded.

Now: the whole row is the target, a leading chevron rotates to carry the state,
and an accent rail runs down the open body so nesting stays readable at depth
(Previous Versions > Version N > Metadata). Leading chevron is deliberate —
More Options keeps a trailing caret, so a menu and a disclosure stop looking
alike. `badge` is optional and takes a count where one is known cheaply; Parts
loads lazily and has nothing to report until it is open, so it passes none.
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
