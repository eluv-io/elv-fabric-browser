import React, {useState} from "react";
import {Tabs, TraversableJson} from "elv-components-js";
import Diff from "../components/Diff";

const JSONField = ({json, diffJson, DiffComponent}) => {
  typeof json === "string" ? json = JSON.parse(json || "{}") : json;

  if(!json || Object.keys(json).length === 0) {
    return <pre className="content-object-data">{JSON.stringify(json, null, 2)}</pre>;
  }

  const [viewType, setViewType] = useState("formatted");

  const options = [["Formatted", "formatted"], ["Raw", "raw"]];

  if(diffJson || DiffComponent) {options.push(["Diff", "diff"]);}

  const tabs = (
    <Tabs
      selected={viewType}
      onChange={value => setViewType(value)}
      options={options}
      className="secondary"
    />
  );

  function Content() {
    switch(viewType) {
      case "raw":
        return <pre className="content-object-data">{JSON.stringify(json, null, 2)}</pre>;
      case "diff":
        if(diffJson) {
          return <Diff json={json} diff={diffJson} />;
        } else if(DiffComponent) {
          return <DiffComponent />;
        }
        break;
      case "formatted":
      default:
        return <TraversableJson json={json} />;
    }
  }

  return (
    <React.Fragment>
      { tabs }
      { Content() }
    </React.Fragment>
  );
};

export default JSONField;
