import {useEffect, useRef, useState} from "react";
import {LabelledField} from "./LabelledField";
import {Button} from "@/components/Components";
import {observer} from "mobx-react";

const ToggleSection = observer(({label, children, className="", toggleOpen=false}) => {
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
        <Button  onClick={() => setShow(!show)}>
          { `${show ? "Hide" : "Show"} ${label}` }
        </Button>
      </LabelledField>
      <div className="children-wrapper" ref={ref}>
        { show ? children : null }
      </div>
    </div>
  );
});

export default ToggleSection;
