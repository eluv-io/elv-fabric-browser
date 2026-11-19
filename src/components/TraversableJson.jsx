

import {useEffect, useState} from "react";
import UrlJoin from "url-join";
//import Confirm from "./Confirm";
import {IconButton} from "@/components/Components";
import {onEnterPressed} from "@/utils/Helpers";

import EditIcon from "@/assets/icons/edit.svg";
import SaveIcon from "@/assets/icons/check.svg";
import DeleteIcon from "@/assets/icons/trash.svg";


const TraversableJson = ({
  label,
  json,
  editable=false,
  onChange,
  onDelete,
  deleteMessage,
  expand=false,
  expandLimit=500000,
  path=""
}) => {
  const [show, setShow] = useState(expand);
  const [expandChildren, setExpandChildren] = useState(expand);
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(JSON.stringify(json || "", null, 2));

  const Save = () => {
    setEditing(false);
    if(onChange) {
      let value = editValue;
      if(parseInt(value).toString() === value) {
        value = parseInt(value);
      } else if(parseFloat(value).toString() === value) {
        value = parseFloat(value);
      }

      if(value === json) { return; }

      onChange({path, json: value});
    }
  };

  useEffect(() => {
    setShow(expand);
    setExpandChildren(expand);
  }, [expand]);

  let content, expandable;
  if(editing) {
    content = (
      <input
        value={editValue}
        onKeyPress={onEnterPressed(Save)}
        onChange={event => setEditValue(event.target.value)}
      />
    );
  } else if(Array.isArray(json)) {
    if(json.length === 0) {
      content = <div className="-elv-literal">[ ]</div>;
    } else {
      expandable = true;
      content = (
        <div className="-elv-indented">
          <div className="-elv-indented">
            {
              json.map((value, i) => (
                <TraversableJson
                  key={`json-key-${path}-${i}`}
                  expand={expandChildren}
                  path={UrlJoin(path, i.toString())}
                  label={i.toString()}
                  json={value}
                  editable={editable}
                  onChange={onChange}
                  onDelete={onDelete}
                  deleteMessage={deleteMessage}
                />
              ))
            }
          </div>
        </div>
      );
    }
  } else if(json !== null && typeof json === "object") {
    if(Object.keys(json).length > 0) {
      expandable = true;

      content = Object.keys(json).map(key => {
        return (
          <div className="-elv-indented" key={`json-key-${path}-${key}`}>
            <TraversableJson
              key={`json-key-${path}-${key}`}
              expand={expandChildren}
              path={UrlJoin(path, key)}
              label={key}
              json={json[key]}
              editable={editable}
              onChange={onChange}
              onDelete={onDelete}
              deleteMessage={deleteMessage}
            />
          </div>
        );
      });
    }
  } else if(typeof json === "string") {
    content = <div className="-elv-literal">{JSON.stringify(json)}</div>;
  } else if(typeof json === "boolean") {
    content = <div className="-elv-literal">{json ? "true" : "false"}</div>;
  } else if(json === null || typeof json === "undefined") {
    content = <div className="-elv-literal">null</div>;
  } else {
    content = <div className="-elv-literal">{json}</div>;
  }

  // Top level component
  if(!path) {
    return (
      <div className="-elv-traversable-json" key="-elv-traversable-json">
        { content }
      </div>
    );
  }

  let expandButton;
  if(expandable && !editing) {
    const disabled = JSON.stringify(json).length > expandLimit;
    expandButton = (
      <button
        hidden={!expandable || (show && expandChildren)}
        className="-elv-expand-button"
        tabIndex={0}
        role={"button"}
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
      >
        ▼
      </button>
    );
  }

  let editButton;
  if(!expandable && editable && onChange) {
    if(editing) {
      editButton = (
        <IconButton
          className="-elv-json-edit-button"
          onClick={Save}
          icon={SaveIcon}
        />
      );
    } else {
      editButton = (
        <IconButton
          className="-elv-json-edit-button"
          onClick={() => {
            setEditValue(expandable ? JSON.stringify(json, null, 2) : json);
            setEditing(true);
          }}
          icon={EditIcon}
        />
      );
    }
  }

  let deleteButton;
  if(editable && onDelete) {
    deleteButton = (
      <IconButton
        className="-elv-json-edit-button"
        onClick={async () => {
          await Confirm({
            message: deleteMessage,
            onConfirm: async () => {
              onDelete({path});
            }
          });
        }}
        icon={DeleteIcon}
      />
    );
  }

  return (
    <div
      key={`traversable-json-${path}`}
      className={`-elv-json-entry ${expandable ? "" : "-elv-json-entry-literal"}`}
    >
      <label
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
        {`${label}${show || editing ? ":" : ""}`}
      </label>
      { expandButton }
      { show || editing ? content : null }
      { show || editing ? editButton : null }
      { show || editing ? null : deleteButton }
    </div>
  );
};

export default TraversableJson;
