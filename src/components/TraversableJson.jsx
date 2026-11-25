import ComponentStyles from "@/assets/stylesheets/modules/components.module.scss";
import {useEffect, useState} from "react";
import UrlJoin from "url-join";
import {CreateModuleClassMatcher, onEnterPressed} from "@/utils/Helpers";
import {CopyableField, CopyButton, IconButton} from "@/components/Components";

import CaretDownIcon from "@/assets/icons/caret-down.svg";

const S = CreateModuleClassMatcher(ComponentStyles);

const TraversableJson = ({
  label,
  json,
  expand=false,
  expandLimit=500000,
  path=""
}) => {
  const [show, setShow] = useState(expand);
  const [expandChildren, setExpandChildren] = useState(expand);

  useEffect(() => {
    setShow(expand);
    setExpandChildren(expand);
  }, [expand]);

  let content, expandable;
  if(Array.isArray(json)) {
    if(json.length === 0) {
      content = <div className={S("traversable-json__leaf")}>[ ]</div>;
    } else {
      expandable = true;
      content = (
        <div className={S("traversable-json__indent")}>
          {
            json.map((value, i) => (
              <TraversableJson
                key={`json-key-${path}-${i}`}
                expand={expandChildren}
                path={UrlJoin(path, i.toString())}
                label={i.toString()}
                json={value}
              />
            ))
          }
        </div>
      );
    }
  } else if(json !== null && typeof json === "object") {
    if(Object.keys(json).length > 0) {
      expandable = true;

      content = Object.keys(json).map(key => {
        return (
          <div className={S("traversable-json__indent")} key={`json-key-${path}-${key}`}>
            <TraversableJson
              key={`json-key-${path}-${key}`}
              expand={expandChildren}
              path={UrlJoin(path, key)}
              label={key}
              json={json[key]}
            />
          </div>
        );
      });
    }
  } else if(typeof json === "string" && json) {
    content = (
      <CopyableField
        value={json}
        alwaysVisible={false}
        smallIcon={false}
        className={S("traversable-json__leaf")}
      >
        {json}
      </CopyableField>
    );
  } else if(typeof json === "boolean") {
    content = <div className={S("traversable-json__leaf")}>{json ? "true" : "false"}</div>;
  } else if(json === null || typeof json === "undefined") {
    content = <div className={S("traversable-json__leaf")}>null</div>;
  } else {
    content = <div className={S("traversable-json__leaf")}>{json}</div>;
  }

  // Top level component
  if(!path) {
    return (
      <div className={S("traversable-json")}>
        {content}
        <CopyButton
          value={typeof json === "string" ? json : JSON.stringify(json, null, 2)}
          size="sm"
          title="Copy to clipboard"
          className={S("traversable-json__copy")}
        />
      </div>
    );
  }

  const disabled = JSON.stringify(json).length > expandLimit;

  return (
    <div
      key={`traversable-json-${path}`}
      className={S("traversable-json__item")}
    >
      <div className={S("traversable-json__label")}>
        <button
          onClick={() => {
            if(show) { setExpandChildren(false); }
            setShow(!show);
          }}
          onKeyPress={onEnterPressed(() => {
            if(show) { setExpandChildren(false); }
            setShow(!show);
          })}
          tabIndex={0}
          aria-label={`${show ? "Collapse" : "Expand"} ${label}`}
          title={`${show ? "Collapse" : "Expand"} ${label}`}
        >
          {label}
        </button>
        <IconButton
          hidden={!expandable || (show && expandChildren)}
          size="sm"
          disabled={disabled}
          onClick={() => {
            setShow(true);
            setExpandChildren(true);
          }}
          onKeyPress={onEnterPressed(() => {
            setShow(true);
            setExpandChildren(true);
          })}
          aria-label="Expand all"
          title={disabled ? "Too large to expand all" : "Expand all"}
          icon={CaretDownIcon}
        />
        <div className={S("traversable-json__copy-item")}>
          <CopyButton
            value={typeof json === "string" ? json : JSON.stringify(json, null, 2)}
            size="sm"
            title={`Copy Metadata from '/${path}'`}
          />
        </div>
      </div>
      { show ? content : null }
    </div>
  );
};

export default TraversableJson;
