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
  "file"
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

    switch(entry.type) {
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
