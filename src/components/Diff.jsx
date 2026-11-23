import ComponentStyles from "@/assets/stylesheets/modules/components.module.scss";

import {useEffect, useState} from "react";
import {observer} from "mobx-react";
import {objectStore} from "@/stores";
import {diffJson} from "diff";
import {IconButton} from "@/components/Components";
import AsyncComponent from "@/components/AsyncComponent";

import UpArrow from "@/assets/icons/arrow-up-circle.svg";
import DownArrow from "@/assets/icons/arrow-down-circle.svg";
import {CreateModuleClassMatcher, ScrollParent} from "@/utils/Helpers";

const S = CreateModuleClassMatcher(ComponentStyles);

const GetDiffParts = ({componentKey, json, diff}) => {
  typeof json === "string" ? json = JSON.parse(json || "{}") : json;
  const diffArray = diffJson(diff, json);
  let diffIndex = 0;

  const parts = diffArray.map((part, i) => {
    const consecutiveAddedPart = part.added ? !!(diffArray[i - 1].removed) : false;
    const containerPattern = /^.+\"container\":.\"hq__[a-zA-Z0-9_]*\"/;
    const isDiff = (part.added || part.removed) && !consecutiveAddedPart && !containerPattern.test(part.value);

    if((part.added || part.removed) && containerPattern.test(part.value)) {
      if(part.removed) {
        return;
      } else {
        part.added = false;
      }
    }

    const element = (
      <p
        key={i}
        id={`${isDiff ? `difference-${componentKey}-${diffIndex}` : ""}`}
        className={S("part", part.added ? "part-addition" : part.removed ? "part-deletion" : "")}
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

  return <pre className={S("diff-block")}>{parts}</pre>;
};

const DiffActions = ({componentKey, totalDiffCount}) => {
  const [currentDiffInView, setCurrentDiffInView] = useState(0);
  const ScrollToDifference = (newIndex) => {
    const element = document.getElementById(`difference-${componentKey}-${newIndex}`);

    if(!element) {
      return;
    }

    element.scrollIntoView({behavior: "smooth", block: "nearest", inline: "start" });

    setCurrentDiffInView(newIndex);
  };

  useEffect(() => {
    setTimeout(() => {
      ScrollToDifference(0);
    }, 500);
  }, []);

  return (
    <div className={S("actions-container")}>
      <IconButton
        icon={UpArrow}
        onClick={() => ScrollToDifference(Math.max(0, currentDiffInView - 1))}
        disabled={currentDiffInView === 0}
        title="Previous Difference"
      />
      <IconButton
        icon={DownArrow}
        onClick={() => ScrollToDifference(Math.min(totalDiffCount - 1, currentDiffInView + 1))}
        disabled={(currentDiffInView + 1) === totalDiffCount}
        title="Next Difference"
      />
    </div>
  );
};

const Diff = observer(({json, diff}) => {
  const [componentKey] = useState(Math.random() * Math.random());
  const [totalDiffCount, setTotalDiffCount] = useState(0);
  const [parts, setParts] = useState([]);

  if(diff) {
    const {parts, diffIndex} = GetDiffParts({
      componentKey,
      json: json.meta,
      diff
    });

    setParts(parts);
    setTotalDiffCount(diffIndex);
  }

  return (
    <div className={S("diff-container")}>
      {
        diff ?
          <RenderDiff parts={parts} /> :
          <AsyncComponent
            loaderClassName={S("loader")}
            Load={
              async () => {
                await objectStore.ContentObjectVersions({
                  libraryId: objectStore.libraryId,
                  objectId: objectStore.objectId
                });

                const previousVersionIndex = ((objectStore.object.versions || []).findIndex(version => version === json.hash)) + 1;
                const previousVersionHash = objectStore.object.versions?.[previousVersionIndex];

                await objectStore.ContentObjectVersion({versionHash: previousVersionHash});
                const {parts, diffIndex} = GetDiffParts({
                  componentKey,
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
        <DiffActions componentKey={componentKey} totalDiffCount={totalDiffCount} />
      }
    </div>
  );
});

export default Diff;
