import React, {useState} from "react";
import {Tabs, TraversableJson} from "elv-components-js";
import Diff from "../components/Diff";
import {Copyable} from "./Copyable";

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

  const length = JSON.stringify(json).length;

  let content;
  switch(viewType) {
    case "raw":
      content = (
        <pre className="content-object-data">
          {
            length > 25000000 ?
              "Metadata too large to display" :
              <Copyable copy={JSON.stringify(json, null, 2)} className="raw-data">{JSON.stringify(json, null, 2)}</Copyable>
          }
        </pre>
      );
      break;
    case "diff":
      if(diffJson) {
        content = (
          <div className="diff-wrapper">
            <Diff json={json} diff={diffJson} />
          </div>
        );
        break;
      } else if(DiffComponent) {
        content = (
          length > 1000000 ?
            <pre className="content-object-data">
              Diff too large to display
            </pre> :
            <div className="diff-wrapper">
              <DiffComponent/>
            </div>
        );
        break;
      }
      break;
    case "formatted":
    default:
      content = <TraversableJson json={json}/>;
      break;
  }

  return (
    <React.Fragment>
      {tabs}
      {content}
    </React.Fragment>
  );
};

export default JSONField;
