import {SafeTraverse} from "./Helpers";

// Helper methods for dealing with custom content type forms

export const BasicTypes = [
  "string",
  "text",
  "integer",
  "number",
  "json",
  "file",
  "list",
  "choice",
  "object"
];

// Initialize the data structure of the schema, filling with initial data if present
export const InitializeSchema = ({schema, initialData={}}) => {
  let data = {};

  const Initialize = (name, fieldSchema, subtree=[]) => {
    if(!fieldSchema) {
      throw Error("Unknown type: " + name);
    }

    if(fieldSchema.type === "object") {
      let result = {};
      fieldSchema.fields.forEach(fieldName => {
        result[fieldName] = Initialize(fieldName, schema.fields[fieldName], subtree.concat(name));
      });
      return result;
    } else if(BasicTypes.includes(fieldSchema.type)) {
      return SafeTraverse(initialData, subtree.concat(name)) || "";
    } else {
      return Initialize(name, schema.fields[fieldSchema.type], subtree);
    }
  };

  schema.main.forEach(fieldName => {
    data[fieldName] = Initialize(fieldName, schema.fields[fieldName]);
  });

  return data;
};

// Get information about the specified field
// -- Traverse reference types down to their basic type
// -- Get the schema of the field as combination of all reference types,
//    with top-level schemas overriding reference schemas
// -- Get the value of the attribute
export const GetFieldInfo = ({schema, data={}, subtree=[], attr}) => {
  const fieldSchema = GetSchema({schema, attr});
  const value = GetValue({data, subtree, attr});

  return {
    ...fieldSchema,
    value
  };
};

export const GetSchema = ({schema, attr}) => {
  const fieldSchema = schema.fields[attr];

  if(!fieldSchema) { throw Error("Unknown type: " + attr); }

  const type = fieldSchema.type;

  if(BasicTypes.includes(type)) {
    // Basic type
    return fieldSchema;
  } else if(schema.fields[type]) {
    // Reference type
    // Return union of this field's schema with the reference type's schema, giving this one priority
    return {
      ...GetSchema({schema, attr: type}),
      ...fieldSchema
    };
  }

  // Unknown type
  throw Error(`Invalid type for "${attr}": "${type}"`);
};

export const GetValue = ({data={}, subtree=[], attr}) => {
  // Determine value of field
  subtree.forEach(key => {
    data = data[key] || {};
  });

  return data[attr];
};

export const SetValue = ({data, subtree=[], attr, value}) => {
  let newData = {
    ...data
  };

  if(subtree.length == 0) {
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
