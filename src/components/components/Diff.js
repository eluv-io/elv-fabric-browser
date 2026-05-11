import React, {useEffect, useRef, useState} from "react";
import {observer} from "mobx-react";
import {objectStore} from "../../stores";
import {IconButton} from "elv-components-js";
import DiffWorker from "./diff.worker.js";

import UpArrow from "../../static/icons/arrow-up-circle.svg";
import DownArrow from "../../static/icons/arrow-down-circle.svg";

const BuildParts = (diffArray) => {
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

const DIFF_TIMEOUT_MS = 30000;

const RenderDiff = ({parts, loading, error}) => {
  if(loading) { return <pre className="content-object-data" style={{flex: 1}}>Computing diff...</pre>; }
  if(error) { return <pre className="content-object-data" style={{flex: 1}}>{error}</pre>; }
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const doneRef = useRef(false);

  useEffect(() => {
    doneRef.current = false;
    setLoading(true);
    setError(null);
    let worker;
    let timeout;

    const run = async () => {
      if(!diff) {
        await objectStore.ContentObjectVersion({versionHash: previousVersionHash});
      }

      // Bail if a MobX re-render re-ran this effect while we were fetching
      if(doneRef.current) { return; }

      const oldMeta = diff || objectStore.versions[previousVersionHash].meta;

      await new Promise(resolve => {
        worker = new DiffWorker();

        timeout = setTimeout(() => {
          worker.terminate();
          setError("Diff timed out");
          setLoading(false);
          resolve();
        }, DIFF_TIMEOUT_MS);

        worker.onmessage = ({data}) => {
          clearTimeout(timeout);
          const {parts, diffIndex} = BuildParts(data);
          setParts(parts);
          setTotalDiffCount(diffIndex);
          setLoading(false);
          doneRef.current = true;
          worker.terminate();
          resolve();
        };

        worker.postMessage({old: oldMeta, new: json.meta});
      });
    };

    run();

    return () => { clearTimeout(timeout); worker?.terminate(); };
  }, [diff, json]);

  return (
    <div className="diff-container">
      <RenderDiff parts={parts} loading={loading} error={error} />
      {
        parts.length > 0 &&
        <DiffActions totalDiffCount={totalDiffCount} />
      }
    </div>
  );
});

export default Diff;
