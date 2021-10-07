import React from "react";
import AsyncComponent from "./AsyncComponent";
import {observer} from "mobx-react";
import {objectStore} from "../../stores";
import {diffJson} from "diff";

const Diff = observer(({json, diff}) => {
  function getPreviousVersionHash() {
    const previousVersionIndex = ((objectStore.object.versions || []).findIndex(version => version === json.hash)) + 1;
    return objectStore.object.versions[previousVersionIndex];
  }

  function renderDiff() {
    typeof json.meta === "string" ? json.meta = JSON.parse(json.meta || "{}") : json.meta;

    const diffArray = diffJson(json.meta, diff || objectStore.versions[getPreviousVersionHash()].meta);
    const parts = diffArray.map((part, i) => {
      return <p key={i} className={part.added ? "part-addition" : part.removed ? "part-deletion" : ""}>{part.value}</p>;
    });

    return <pre className="diff-block">{parts}</pre>;
  }

  return (
    <React.Fragment>
      {
        diff ?
          renderDiff() :
          <AsyncComponent
            Load={
              async() => await objectStore.ContentObjectVersion({versionHash: getPreviousVersionHash()})
            }
            render={() => renderDiff()}
          />
      }
    </React.Fragment>
  );
});

export default Diff;
