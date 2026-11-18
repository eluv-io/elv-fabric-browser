import CommonStyles from "@/assets/stylesheets/modules/common.module.scss";

import {useEffect, useRef, useState} from "react";
import ContentLookup from "./ContentLookup";
import {objectStore} from "@/stores";
import {observer} from "mobx-react";
import {Button, IconButton} from "@/components/Components";
import {CreateModuleClassMatcher} from "@/utils/Helpers";

const S = CreateModuleClassMatcher(CommonStyles);

const ActionsToolbar = observer(({actions, iconActions, SaveDraft, showContentLookup=true}) => {
  const [moreOptionsOpen, setMoreOptionsToggle] = useState(false);
  const outsideContainerRef = useRef(null);

  if(!actions) { actions = []; }

  let saveDraftButton;
  if(objectStore.writeTokens[objectStore.objectId]) {
    saveDraftButton = (
      <Button className="important" onClick={() => SaveDraft()}>
        Save Draft
      </Button>
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
      const {key, type, path, onClick, label, className, disabled, title} = action;

      return (
        <Button
          key={key || index}
          type={type}
          to={path}
          onClick={onClick}
          className={`list-item${className ? " " + className : ""}`}
          disabled={disabled}
          title={title}
        >
          {label}
        </Button>
      );
    })
  );

  const MoreOptionsDropdown = () => {
    if(visibleActions.length < 3) {
      return null;
    }

    return (
      <div className="more-options-container" ref={outsideContainerRef}>
        <Button type="button" onClick={() => setMoreOptionsToggle(prevState => !prevState)}>
          <span className="more-options-text">More Options</span>
        </Button>
        <div className={`more-options-menu ${moreOptionsOpen ? "more-options-menu--open" : ""}`}>
          <ul className="options-list" role="menu">
            {
              visibleActions.slice(2).map((action, index) => {
                const {key, type, path, onClick, label, className, dividerAbove, disabled, title} = action;

                return (
                  <Button
                    key={key || index}
                    className={`list-item${dividerAbove ? " list-divider" : ""}${className ? " list-item-" + className : ""}`}
                    title={title}
                    type={type}
                    button={false}
                    to={path}
                    onClick={() => {
                      setMoreOptionsToggle(false);
                      onClick();
                    }}
                    disabled={disabled}
                  >
                    {label}
                  </Button>
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
    <div className={S("actions-toolbar")}>
      <div className={S("actions-toolbar__left")}>
        { primaryActions }
        { MoreOptionsDropdown() }
        { saveDraftButton }
      </div>
      {
        (iconActionElements || showContentLookup) ?
          <div className={S("actions-toolbar__right")}>
            <ContentLookup />
            { iconActionElements }
          </div> : null
      }
    </div>
  );
});

export default ActionsToolbar;
