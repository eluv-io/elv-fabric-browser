import {warningStore} from "../../stores";
import React from "react";
import CloseIcon from "../../static/icons/close.svg";
import {IconButton} from "elv-components-js";

const Warnings = () => {
  if(!warningStore.activeWarnings.length) { return null; }

  return (
    <div className="warnings-container">
      {
        warningStore.activeWarnings.map(warning => (
          <div className="warning-box" key={warning.id}>
            { warning.message }
            <IconButton
              className="clear-notification"
              icon={CloseIcon}
              label="clear-warning"
              onClick={() => warningStore.DismissWarning(warning.id)}
            />
          </div>
        ))
      }
    </div>
  );
};

export default Warnings;
