import CommonStyles from "@/assets/stylesheets/modules/common.module.scss";

import ContentLookup from "@/components/ContentLookup";
import {objectStore} from "@/stores";
import {observer} from "mobx-react";
import {Button, IconButton, Linkish} from "@/components/Components";
import {CreateModuleClassMatcher} from "@/utils/Helpers";
import {Popover} from "@mantine/core";

import SelectIcon from "@/assets/icons/select.svg";
import {useState} from "react";

const S = CreateModuleClassMatcher(CommonStyles);

const ActionsToolbar = observer(({actions, iconActions, SaveDraft, showContentLookup=true}) => {
  if(!actions) { actions = []; }

  let saveDraftButton;
  if(objectStore.writeTokens[objectStore.objectId]) {
    saveDraftButton = (
      <Button className="important" onClick={() => SaveDraft()}>
        Save Draft
      </Button>
    );
  }

  const visibleActions = actions.filter(action => !action.hidden);

  const primaryActions = (
    visibleActions.slice(0, 2).map((action, index) => {
      const {key, type, path, onClick, label, variant, disabled, title} = action;

      return (
        <Button
          key={key || index}
          type={type}
          to={path}
          onClick={onClick}
          variant={variant}
          disabled={disabled}
          title={title}
        >
          {label}
        </Button>
      );
    })
  );

  const MoreOptionsDropdown = () => {
    const [opened, setOpened] = useState(false);

    if(visibleActions.length < 3) {
      return null;
    }

    return (
      <Popover
        width={200}
        opened={opened}
        onChange={setOpened}
        classNames={{dropdown: S("actions-toolbar__dropdown")}}
      >
        <Popover.Target>
          <Button onClick={() => setOpened(!opened)} rightIcon={SelectIcon} variant="outline-subtle">
            More Options
          </Button>
        </Popover.Target>
        <Popover.Dropdown>
          {
            visibleActions.slice(2).map((action, index) =>
              <div key={`item-${index}`}>
                {
                  !action.dividerAbove ? null :
                    <div className={S("actions-toolbar__divider")} />
                }
                <Linkish
                  disabled={action.disabled}
                  to={action.path}
                  onClick={
                    !action.onClick ? null :
                      event => {
                        setOpened(false);
                        action.onClick(event);
                      }
                  }
                  className={S("actions-toolbar__item")}
                >
                  {action.label}
                </Linkish>
              </div>
            )
          }
        </Popover.Dropdown>
      </Popover>
    );
  };

  const iconActionElements = !iconActions ? null :
    iconActions.map((action, index) => {
      const {className, icon, label, onClick, key} = action;

      return (
        <IconButton
          className={className}
          icon={icon}
          label={label}
          onClick={onClick}
          key={key || index}
          variant="light"
        />
      );
    });

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
