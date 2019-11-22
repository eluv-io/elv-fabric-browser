import React, {useState} from "react";
import {Tabs, TraversableJson} from "elv-components-js";

const JSONField = ({json}) => {
  if(!json || Object.keys(json).length === 0) {
    return <pre className="content-object-data">{JSON.stringify(json, null, 2)}</pre>;
  }

  const [showRaw, setShowRaw] = useState(false);

  const tabs = (
    <Tabs
      selected={showRaw}
      onChange={value => setShowRaw(value)}
      options={[["Formatted", false], ["Raw", true]]}
      className="secondary"
    />
  );

  const content = showRaw ?
    <pre className="content-object-data">{JSON.stringify(json, null, 2)}</pre> :
    <TraversableJson json={json} />;

  return (
    <React.Fragment>
      { tabs }
      { content }
    </React.Fragment>
  );
};

export default JSONField;
