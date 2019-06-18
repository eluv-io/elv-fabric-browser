/* Type Schema Grammar:

  Schema: [ Entry ]
  Entry: { Key, Type, { Options } }
  Key: string
  Type:
    "label" |
    "string" |
    "text" |
    "integer" |
    "number" |
    "json" |
    "boolean" |
    "choice" |
    "list" |
    "object" |
    "file" |
    "attachedFile"

  Options:
  *:
    - label: string
      - The label for this field. If not set, the key will be used as the label
    - required: boolean
      - Whether or not this field is required. Validation will be performed on the form
         using the html5 "required" attribute
  "label":
    - text: string
      - The text to be displayed in the label
  "object":
    - fields: Schema
      - The schema of the object
    - flattenDisplay: boolean
      - If true, the fields will not be wrapped in a subsection in the form with the object 		   label -- the fields will appear as if they were not contained in an object.
  "choice":
    - options: [ [label, value], ...]
      - List of options to choose from
  "file":
    - multiple: boolean
      - If specified, will allow uploading of multiple files. Otherwise, only a single file will
         be allowed
    - accept: mime-type-string | [ mime-type-string ]
      - Limits the allowed filetypes to be upload to the specified mime-types
  "attachedFile":
    - hash: string
      - The hash of the content type part corresponding to the attached file

  Schema are specified in the "eluv.schema" tag in the content type metadata.

  Custom metadata manipulation can be allowed by setting "eluv.allowCustomMetadata" in the content type metadata

 */

import Id from "./Id";
import {SafeTraverse} from "./Helpers";

// Helper methods for dealing with custom content type forms

export const BasicTypes = [
  "label",
  "string",
  "text",
  "integer",
  "number",
  "json",
  "boolean",
  "choice",
  "list",
  "object",
  "file",
  "attachedFile"
];

export const FromList = (list) => {
  let struct = {};
  list.forEach(element => {
    struct[Id.next()] = element;
  });
  return struct;
};

export const ToList = (struct) => {
  return Object.keys(struct).map(index => parseInt(index)).sort().map(index => struct[index]);
};

// Initialize the data structure based on the schema, populating with any initial data
export const InitializeSchema = ({schema, initialData}) => {
  initialData = initialData || {};

  let data = {};
  schema.forEach(entry => {
    if(!BasicTypes.includes(entry.type)) { throw Error("Unknown type: " + entry.type); }

    switch (entry.type) {
      case "object":
        data[entry.key] = InitializeSchema({schema: entry.fields, initialData: initialData[entry.key]});
        break;
      case "json":
        data[entry.key] = JSON.stringify(initialData[entry.key], null, 2);
        break;
      case "list":
        data[entry.key] = FromList(initialData[entry.key] || []);
        break;
      default:
        data[entry.key] = initialData[entry.key];

        // Specifically test for undefined instead of falsy - 'false' is a valid value
        if(data[entry.key] === undefined) {
          data[entry.key] = entry.type === "boolean" ? false : "";
        }
    }
  });

  return data;
};

// Extract a specific value from the data
export const GetValue = ({data={}, subtree=[], attr}) => {
  return SafeTraverse(data, subtree.concat(attr));
};

export const RemoveValue = ({data, subtree=[], attr}) => {
  let newData = {
    ...data
  };

  if(subtree.length === 0) {
    delete newData[attr];
  } else {
    // Changing nested data - traverse data by reference to get
    // to proper nesting level
    let pointer = newData;
    subtree.forEach(key => {
      if(!pointer[key]) { return; }
      pointer = pointer[key];
    });

    delete pointer[attr];
  }

  return newData;
};

// Set a specific value in the data
export const SetValue = ({data, subtree=[], attr, value}) => {
  let newData = {
    ...data
  };

  if(subtree.length === 0) {
    newData[attr] = value;
  } else {
    // Changing nested data - traverse data by reference to get
    // to proper nesting level
    let pointer = newData;
    subtree.forEach(key => {
      if(!pointer[key]) {
        pointer[key] = {};
      }
      pointer = pointer[key];
    });

    pointer[attr] = value;
  }

  return newData;
};
