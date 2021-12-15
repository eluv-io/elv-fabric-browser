import React, {useState} from "react";
import AsyncComponent from "./AsyncComponent";
import {observer} from "mobx-react";
import {objectStore} from "../../stores";
import {diffJson} from "diff";
import {IconButton} from "elv-components-js";

import UpArrow from "../../static/icons/arrow-up-circle.svg";
import DownArrow from "../../static/icons/arrow-down-circle.svg";

const Diff = observer(({json, diff}) => {
  const previousVersionIndex = ((objectStore.object.versions || []).findIndex(version => version === json.hash)) + 1;
  const previousVersionHash = objectStore.object.versions[previousVersionIndex];
  const [totalDiffCount, setTotalDiffCount] = useState(0);
  const [currentDiffInView, setCurrentDiffInView] = useState(0);

  const RenderDiff = () => {
    typeof json.meta === "string" ? json.meta = JSON.parse(json.meta || "{}") : json.meta;

    const diffArray = diffJson(diff || objectStore.versions[previousVersionHash].meta, json.meta);

    let diffIndex = 0;
    const parts = diffArray.map((part, i) => {
      const isDiff = part.added || part.removed;

      const element = (
        <p
          key={i}
          id={`${isDiff ? `difference-${diffIndex}` : ""}`}
          className={part.added ? "part-addition" : part.removed ? "part-deletion" : ""}
        >
          {part.value}
        </p>
      );

      if(isDiff) { diffIndex++; }

      return element;
    });

    setTotalDiffCount(diffIndex);

    return <pre className="diff-block">{parts}</pre>;
  };

  const ScrollToDifference = (newIndex) => {
    setCurrentDiffInView(newIndex);
    document.getElementById(`difference-${newIndex}`).scrollIntoView();
  };

  const diffActions = (
    <div className="actions-container">
      <IconButton
        icon={UpArrow}
        onClick={() => ScrollToDifference(currentDiffInView - 1)}
        disabled={currentDiffInView === 0}
        title="Previous Difference"
      />
      <IconButton
        icon={DownArrow}
        onClick={() => ScrollToDifference(currentDiffInView + 1)}
        disabled={(currentDiffInView + 1) === totalDiffCount}
        title="Next Difference"
      />
    </div>
  );

  return (
    <div className="diff-wrapper">
      { diffActions }
      {diff ?
        RenderDiff() :
        <AsyncComponent
          Load={
            async () => await objectStore.ContentObjectVersion({versionHash: previousVersionHash})
          }
          render={() => RenderDiff()}
        />}
    </div>
  );
});

export default Diff;
