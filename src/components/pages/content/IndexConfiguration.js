import React, {useState} from "react";
import {Redirect} from "react-router";
import {withRouter} from "react-router-dom";
import {observer} from "mobx-react";

import UrlJoin from "url-join";
import Path from "path";

import AddIcon from "../../../static/icons/plus-square.svg";
import DeleteIcon from "../../../static/icons/trash.svg";
import {Action, AsyncComponent, Confirm, IconButton} from "elv-components-js";
import {objectStore} from "../../../stores";

const IndexConfiguration = observer((props) => {
  const [objectId, setObjectId] = useState("");
  const [indexerFields, setIndexerFields] = useState({});

  const SaveForm = async () => {
    let message;

    await Confirm({
      message: "Are you sure you want to save your changes?",
      additionalInputs: [{
        label: "Commit Message (optional)",
        name: "commitMessage",
        onChange: commitMessage => message = (commitMessage)
      }],
      onConfirm: async () => {
        const metadata = {};

        Object.keys(indexerFields).forEach(fieldIndex => {
          const {label, paths, options, type} = indexerFields[fieldIndex];

          metadata[label] = {
            paths,
            options,
            type
          };
        });

        const objectId = await objectStore.EditAndFinalizeMetadata({
          libraryId: objectStore.libraryId,
          objectId: objectStore.objectId,
          metadataSubtree: "indexer/config/indexer/arguments/fields",
          metadata,
          commitMessage: message || "Update index configuration"
        });

        setObjectId(objectId);
      }
    });
  };

  const UpdateIndex = async () => {
    await Confirm({
      message: "Are you sure you want to update search index?",
      onConfirm: async () => {
        await objectStore.UpdateIndex({
          libraryId: objectStore.libraryId,
          objectId: objectStore.objectId,
          method: "search_update",
          constant: false
        });
      }
    });
  };

  const UpdateFormValue = ({field, key, value}) => {
    const fieldsData = Object.assign({}, indexerFields);

    fieldsData[field][key] = value;
    setIndexerFields(fieldsData);
  };

  const AddField = () => {
    const fieldsData = Object.assign({}, indexerFields);
    const fieldCount = Object.keys(fieldsData).length;

    fieldsData[fieldCount] = {
      paths: undefined,
      options: {},
      type: "text",
      label: ""
    };

    setIndexerFields(fieldsData);
  };

  const RemoveField = (index) => {
    const fieldsData = Object.assign({}, indexerFields);

    delete fieldsData[index];
    setIndexerFields(fieldsData);
  };

  const form = (
    Object.keys(indexerFields).map((field, index) => {
      const {options, paths, type, label} = indexerFields[field];

      return (
        <div className="list-fields" key={field}>
          <div className={`list-field-entry${index % 2 === 0 ? " even" : " odd"}`}>
            <div className="actions">
              <IconButton
                icon={DeleteIcon}
                title="Remove item"
                onClick={async () => await Confirm({
                  message: "Are you sure you want to remove this item?",
                  onConfirm: () => RemoveField(index)
                })}
                className="info-list-icon info-list-remove-icon"
              />
            </div>

            <div className="-elv-input list-field-input">
              <label htmlFor={field}>Label</label>
              <input
                type="text"
                value={label}
                placeholder="config_field"
                onChange={event => {
                  UpdateFormValue({
                    field,
                    key: "label",
                    value: event.target.value
                  });
                }}
              />
            </div>
            
            <div className="-elv-input list-field-input">
              <label htmlFor={field}>Paths</label>
              <input
                type="text"
                name={field}
                placeholder="public.movies.*.title"
                value={paths ? paths[0] : ""}
                onChange={event => {
                  UpdateFormValue({
                    field,
                    key: "paths",
                    value: [event.target.value]
                  });
                }}
              />
            </div>

            <div className="-elv-input -elv-checkbox-input list-field-input">
              <label htmlFor={field}>Histogram</label>
              <div className="checkbox-container">
                <input
                  type="checkbox"
                  name={field}
                  checked={(!!options && options.stats) ? options.stats.histogram : false}
                  value={(!!options && options.stats) ? options.stats.histogram : false}
                  onChange={event => {
                    UpdateFormValue({
                      field,
                      key: "options",
                      value: event.target.checked ? {
                        stats: {
                          histogram: event.target.checked
                        }
                      } : {}
                    });
                  }}
                />
              </div>
            </div>

            <div className="-elv-input -elv-select list-field-input">
              <label htmlFor={field}>Type</label>
              <select
                value={type}
                name={field}
                onChange={event => {
                  UpdateFormValue({
                    field,
                    key: "type",
                    value: event.target.value
                  });
                }}
              >
                <option value="text">Text</option>
                <option value="string">String</option>
              </select>
            </div>
          </div>
        </div>
      );
    })
  );

  const PageContent = () => {
    if(objectId) {
      const redirectPath = UrlJoin(Path.dirname(props.match.url));
      return <Redirect push to={redirectPath}/>;
    }

    return (
      <div className="indexer-configuration-container">
        <div className="app-header">
          <Action
            type="button"
            className="secondary"
            onClick={UpdateIndex}
          >
            Update Index
          </Action>
          <h1>{`Indexer Configuration for "${objectStore.object.name || ""}"`}</h1>
          <Action
            type="button"
            className="indexer-save-button -elv-button"
            onClick={SaveForm}
          >
            Save
          </Action>
        </div>

        <div className="indexer-fields-page">
          <div className="indexer-info-container">
            <div className="-elv-input list-field-container">
              <label>Indexer Configuration Fields</label>
              <div>
                { form }
                <IconButton
                  icon={AddIcon}
                  title="Add Configuration Field"
                  onClick={AddField}
                  className="info-list-icon info-list-add-icon secondary"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <AsyncComponent
      Load={() => {
        if(
          objectStore.object.meta.indexer &&
          objectStore.object.meta.indexer.config &&
          objectStore.object.meta.indexer.config.indexer &&
          objectStore.object.meta.indexer.config.indexer.arguments &&
          objectStore.object.meta.indexer.config.indexer.arguments.fields
        ) {
          const fieldsObject = Object.assign({}, objectStore.object.meta.indexer.config.indexer.arguments.fields);
          const newObject = {};

          Object.keys(fieldsObject).forEach((fieldName, index) => {
            newObject[index] = {
              ...fieldsObject[fieldName],
              label: fieldName
            };
          });

          setIndexerFields(newObject);
        }
      }}
      render={PageContent}
    />
  );
});

export default withRouter(IndexConfiguration);
