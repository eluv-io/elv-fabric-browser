import React, {useEffect, useRef, useState} from "react";
import {Action, IconButton} from "elv-components-js";
import ContentLookup from "./ContentLookup";
import {objectStore} from "../../stores";
import {observer} from "mobx-react";

const ActionsToolbar = observer(({actions, iconActions, showContentLookup=true}) => {
  const [moreOptionsOpen, setMoreOptionsToggle] = useState(false);
  const outsideContainerRef = useRef(null);

  if(!actions) { actions = []; }

  let saveDraftButton;
  if(objectStore.writeTokens[objectStore.objectId]) {
    saveDraftButton = (
      <Action className="important" onClick={() => this.SaveContentObjectDraft()}>
        Save Draft
      </Action>
    );
  }

  const HandleClickOutside = (event) => {
    if(outsideContainerRef.current && !outsideContainerRef.current.contains(event.target)) {
      setMoreOptionsToggle(false);
    }
  };

  const HandleEscapeKey = (event) => {
    if(event.key === "Escape") {
      setMoreOptionsToggle(false);
    }
  };

  useEffect(() => {
    document.addEventListener("mousedown", HandleClickOutside);
    document.addEventListener("keydown", HandleEscapeKey);

    return (() => {
      document.removeEventListener("mousedown", HandleClickOutside);
      document.removeEventListener("keydown", HandleEscapeKey);
    });
  }, []);

  const visibleActions = actions.filter(action => !action.hidden);

  const primaryActions = (
    visibleActions.slice(0, 2).map((action, index) => {
      const {key, type, path, onClick, label, className} = action;

      return (
        <Action
          key={key || index}
          type={type}
          to={path}
          onClick={onClick}
          className={`list-item${className ? " " + className : ""}`}
        >
          {label}
        </Action>
      );
    })
  );

  const MoreOptionsDropdown = () => {
    if(visibleActions.length < 3) {
      return null;
    }

    return (
      <div className="more-options-container" ref={outsideContainerRef}>
        <Action type="button" onClick={() => setMoreOptionsToggle(prevState => !prevState)}>
          <span className="more-options-text">More Options</span>
        </Action>
        <div className={`more-options-menu ${moreOptionsOpen ? "more-options-menu--open" : ""}`}>
          <ul className="options-list" role="menu">
            {
              visibleActions.slice(2).map((action, index) => {
                const {key, type, path, onClick, label, className, dividerAbove} = action;

                return (
                  <Action
                    key={key || index}
                    className={`list-item${dividerAbove ? " list-divider" : ""}${className ? " list-item-" + className : ""}`}
                    type={type}
                    button={false}
                    to={path}
                    onClick={() => {
                      setMoreOptionsToggle(false);
                      onClick();
                    }}
                  >
                    {label}
                  </Action>
                );
              })
            }
          </ul>
        </div>
      </div>
    );
  };

  const iconActionElements = iconActions ? iconActions.map((action, index) => {
    const {className, icon, label, onClick, key} = action;

    return (
      <IconButton
        className={className}
        icon={icon}
        label={label}
        onClick={onClick}
        key={key || index}
      />
    );
  }) : null;

  return (
    <div className="actions-wrapper">
      <div className="actions-container">
        <div className="left-action-buttons">
          { primaryActions }
          { MoreOptionsDropdown() }
          { saveDraftButton }
        </div>
        {
          (iconActionElements || showContentLookup) ?
            <div className="right-action-buttons">
              <ContentLookup />
              { iconActionElements }
            </div> : null
        }
      </div>
    </div>
  );
});

export default ActionsToolbar;
