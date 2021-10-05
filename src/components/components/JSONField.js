import React, {useState} from "react";
import {Tabs, TraversableJson} from "elv-components-js";
import ReactDiffViewer from "react-diff-viewer";

const JSONField = ({json, previousVersionJson = null}) => {
  if(!json || Object.keys(json).length === 0) {
    return <pre className="content-object-data">{JSON.stringify(json, null, 2)}</pre>;
  }

  const [viewType, setViewType] = useState("formatted");

  const options = [["Formatted", "formatted"], ["Raw", "raw"]];

  if(previousVersionJson && Object.keys(previousVersionJson).length > 0) {
    options.push(["Diff", "diff"]);
  }

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
        return <ReactDiffViewer oldValue={JSON.stringify(json)} newValue={JSON.stringify(previousVersionJson)} splitView={false} hideLineNumbers={true} />;
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
