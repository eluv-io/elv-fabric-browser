import ComponentStyles from "@/assets/stylesheets/modules/components.module.scss";

import React, {useState} from "react";
import Diff from "@/components/Diff";
import {Tabs} from "@mantine/core";
import TraversableJson from "@/components/TraversableJson";
import {observer} from "mobx-react";
import {CopyableField, CopyButton, IconButton} from "@/components/Components";
import {CreateModuleClassMatcher} from "@/utils/Helpers";

const S = CreateModuleClassMatcher(ComponentStyles);

const JSONField = observer(({json, diffJson, DiffComponent}) => {
  typeof json === "string" ? json = JSON.parse(json || "{}") : json;

  if(!json || Object.keys(json).length === 0) {
    return <pre className="content-object-data">{JSON.stringify(json, null, 2)}</pre>;
  }

  const [viewType, setViewType] = useState("formatted");

  const length = JSON.stringify(json).length;

  let content;
  switch(viewType) {
    case "raw":
      content = (
        <pre className={S("json__raw", "monospace")}>
          {
            length > 25000000 ?
              "Metadata too large to display" :
              <>
                {JSON.stringify(json, null, 2)}
                <CopyButton size="sm" value={JSON.stringify(json, null, 2)} className={S("json__copy")} />
              </>
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
    <div className={S("json")}>
      <Tabs
        variant="pills"
        color="var(--background-secondary)"
        value={viewType}
        onChange={setViewType}
        classNames={{
          tab: S("json__tab")
        }}
      >
        <Tabs.List>
          <Tabs.Tab value="formatted">
            Formatted
          </Tabs.Tab>
          <Tabs.Tab value="raw">
            Raw
          </Tabs.Tab>
          {
            !diffJson && !DiffComponent ? null :
              <Tabs.Tab value="diff">
                Diff
              </Tabs.Tab>
          }
        </Tabs.List>
      </Tabs>
      <div className={S("json__content")}>
        {content}
      </div>
    </div>
  );
});

export default JSONField;
