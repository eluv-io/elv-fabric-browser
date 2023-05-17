import React, {useEffect, useState} from "react";
import AsyncComponent from "./AsyncComponent";
import {observer} from "mobx-react";
import {objectStore} from "../../stores";
import {diffJson} from "diff";
import {IconButton} from "elv-components-js";

import UpArrow from "../../static/icons/arrow-up-circle.svg";
import DownArrow from "../../static/icons/arrow-down-circle.svg";

const GetDiffParts = ({json, diff}) => {
  typeof json === "string" ? json = JSON.parse(json || "{}") : json;
  const diffArray = diffJson(diff, json);
  let diffIndex = 0;

  const parts = diffArray.map((part, i) => {
    const consecutiveAddedPart = part.added ? !!(diffArray[i - 1].removed) : false;
    const isDiff = (part.added || part.removed) && !consecutiveAddedPart;

    if((part.added || part.removed) && part.value.includes("\"container\": \"hq__")) {
      return;
    }

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

  return {parts, diffIndex};
};

const RenderDiff = ({parts}) => {
  if(!parts) { return null; }

  return <pre className="diff-block">{parts}</pre>;
};

const DiffActions = ({totalDiffCount}) => {
  const [currentDiffInView, setCurrentDiffInView] = useState(0);

  useEffect(() => {
    setTimeout(() => {
      ScrollToDifference(0);
    }, 100);
  }, []);

  const ScrollToDifference = (newIndex) => {
    setCurrentDiffInView(newIndex);
    const element = document.getElementById(`difference-${newIndex}`);

    if(element) { element.scrollIntoView(); }
  };

  return (
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
};

const Diff = observer(({json, diff}) => {
  const previousVersionIndex = ((objectStore.object.versions || []).findIndex(version => version === json.hash)) + 1;
  const previousVersionHash = objectStore.object.versions[previousVersionIndex];
  const [totalDiffCount, setTotalDiffCount] = useState(0);
  const [parts, setParts] = useState([]);

  if(diff) {
    const {parts, diffIndex} = GetDiffParts({
      json: json.meta,
      diff
    });

    setParts(parts);
    setTotalDiffCount(diffIndex);
  }

  return (
    <div className="diff-container">
      {
        diff ?
          <RenderDiff parts={parts} /> :
          <AsyncComponent
            Load={
              async () => {
                await objectStore.ContentObjectVersion({versionHash: previousVersionHash});
                const {parts, diffIndex} = GetDiffParts({
                  json: json.meta,
                  diff: objectStore.versions[previousVersionHash].meta
                });

                setParts(parts);
                setTotalDiffCount(diffIndex);
              }
            }
            render={() => (
              <RenderDiff parts={parts} />
            )}
          />
      }
      {
        parts.length > 0 &&
        <DiffActions totalDiffCount={totalDiffCount} />
      }
    </div>
  );
});

export default Diff;
