// Properly handle input value updates
import React from "react";
import PropTypes from "prop-types";

export const InputValue = (event) => {
  if(event.target.type === "checkbox") {
    return event.target.checked;
  } else {
    return event.target.value;
  }
};

// Parse JSON for input values
// -- Allows whitespace and blank
// -- Rejects quoted strings which JSON.parse allows (e.g. JSON.parse('"string"')
export const ParseInputJson = (metadata) => {
  if(typeof metadata === "string") {
    metadata = metadata.trim();

    if(metadata === "") { return {}; }

    if(!metadata.startsWith("{") && !metadata.startsWith("[")) { throw Error("Invalid JSON"); }

    try {
      return JSON.parse(metadata);
    } catch(error) {
      throw Error("Invalid JSON");
    }
  }

  return metadata || {};
};

// Add to onKeyUp event to validate JSON input while typing
export const ValidateJsonInput = (value, target) => {
  try {
    const parsedValue = ParseInputJson(value);
    target.style.border = "";
    target.style.outline = "";
    target.title = "";
    return parsedValue;
  } catch(error) {
    target.style.border = "1px solid red";
    target.style.outline = "none";
    target.title = error;
  }
};

// Add to onBlur event to automatically format JSON input when
// focus is lost.
// UpdateValue is a function that updates the given value in component state
export const FormatJsonInput = (event, value, UpdateValue) => {
  const parsedValue = ValidateJsonInput(value, event.target);

  if(parsedValue) {
    UpdateValue(JSON.stringify(parsedValue, null, 2));
  }
};

// Automatically format and validate JSON
export const JsonTextArea = ({name, value, onChange, UpdateValue, className}) => {
  return (
    <textarea
      className={className}
      name={name}
      value={value}
      onChange={onChange}
      onKeyUp={(event) => {
        ValidateJsonInput(value, event.target);
      }}
      onBlur={(event) => FormatJsonInput(event, value, UpdateValue)}
    />
  );
};

JsonTextArea.propTypes = {
  name: PropTypes.string.isRequired,
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  UpdateValue: PropTypes.func.isRequired,
  className: PropTypes.string
};
