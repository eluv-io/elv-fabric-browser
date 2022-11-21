import React, {useState} from "react";
import {Redirect} from "react-router";
import {withRouter} from "react-router-dom";
import {observer} from "mobx-react";

import UrlJoin from "url-join";
import Path from "path";

import AddIcon from "../../../static/icons/plus-square.svg";
import DeleteIcon from "../../../static/icons/trash.svg";
import QuestionMarkIcon from "../../../static/icons/help-circle.svg";
import LinkIcon from "../../../static/icons/external-link.svg";

import {Action, AsyncComponent, Confirm, IconButton, IconLink, ImageIcon, Modal, ToolTip} from "elv-components-js";
import {objectStore} from "../../../stores";
import {ContentBrowserModal} from "../../components/ContentBrowser";

const IndexConfiguration = observer((props) => {
  const [objectId, setObjectId] = useState("");
  const [indexerFields, setIndexerFields] = useState({});
  const [showNoUpdateModal, setShowNoUpdateModal] = useState(false);
  const [docPrefix, setDocPrefix] = useState("/");
  const [querySuffix, setQuerySuffix] = useState("");
  const [showContentBrowser, setShowContentBrowser] = useState(false);
  const [rootObject, setRootObject] = useState();
  const [rootLibrary, setRootLibrary] = useState();
  const [rootName, setRootName] = useState();

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
        const fieldsMetadata = {};

        Object.keys(indexerFields).forEach(fieldIndex => {
          const {label, paths, options, type} = indexerFields[fieldIndex];

          fieldsMetadata[label] = {
            paths,
            options,
            type
          };
        });


        const callback = async ({writeToken}) => {
          const replaceMetaPayload = {
            libraryId: objectStore.libraryId,
            objectId: objectStore.objectId,
            writeToken
          };

          await objectStore.ReplaceMetadata({
            ...replaceMetaPayload,
            metadataSubtree: "indexer/config/fabric/root/content",
            metadata: rootObject
          });

          await objectStore.ReplaceMetadata({
            ...replaceMetaPayload,
            metadataSubtree: "indexer/config/fabric/root/library",
            metadata: rootLibrary
          });

          await objectStore.ReplaceMetadata({
            ...replaceMetaPayload,
            metadataSubtree: "indexer/config/indexer/arguments/document/prefix",
            metadata: docPrefix
          });

          await objectStore.ReplaceMetadata({
            ...replaceMetaPayload,
            metadataSubtree: "indexer/config/indexer/arguments/query/suffix",
            metadata: querySuffix
          });

          await objectStore.ReplaceMetadata({
            ...replaceMetaPayload,
            metadataSubtree: "indexer/config/indexer/arguments/field",
            metadata: fieldsMetadata
          });
        };

        await objectStore.EditAndFinalizeContentObject({
          libraryId: objectStore.libraryId,
          objectId: objectStore.objectId,
          callback,
          commitMessage: message || "Update index configuration"
        });

        setObjectId(objectStore.objectId);
      }
    });
  };

  const UpdateIndex = async () => {
    const {libraryId, objectId} = objectStore;
    const rootObjectId = (
      objectStore.object.meta &&
      objectStore.object.meta.indexer &&
      objectStore.object.meta.indexer.config &&
      objectStore.object.meta.indexer.config.fabric &&
      objectStore.object.meta.indexer.config.fabric.root &&
      objectStore.object.meta.indexer.config.fabric.root.content
    );

    const lastRunTime = await objectStore.GetContentObjectMetadata({
      libraryId,
      objectId,
      metadataSubtree: "indexer/last_run_time"
    });

    const lastRunHash = await objectStore.GetContentObjectMetadata({
      libraryId,
      objectId,
      metadataSubtree: "indexer/last_run"
    });

    const latestVersionHash = await objectStore.LatestVersionHash({
      objectId: rootObjectId,
      versionHash: lastRunHash
    });

    if(!lastRunHash || lastRunHash !== latestVersionHash) {
      await Confirm({
        message: `Are you sure you want to update search index?${lastRunTime ? `\nLast run time: ${lastRunTime}` : ""}`,
        onConfirm: async () => {
          await objectStore.UpdateIndex({
            libraryId,
            objectId,
            method: "search_update",
            constant: false,
            latestHash: latestVersionHash
          });
        }
      });
    } else {
      setShowNoUpdateModal(true);
    }
  };

  const NoUpdateModal = () => {
    if(!showNoUpdateModal) return null;

    return (
      <Modal
        className={"no-update-modal"}
        closable={false}
      >
        <div className="update-status-message">
          No updates required.
          <Action
            className="secondary"
            onClick={() => setShowNoUpdateModal(false)}
          >
            Close
          </Action>
        </div>
      </Modal>
    );
  };

  const UpdateFormValue = ({field, key, arrayIndex, value}) => {
    const fieldsData = Object.assign({}, indexerFields);

    if(arrayIndex !== undefined) {
      fieldsData[field][key][arrayIndex] = value;
    } else {
      fieldsData[field][key] = value;
    }
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

  const InputFormField = ({labelText, labelHint, onChange, value, placeholder}) => {
    let label;

    if(labelHint) {
      label = (
        <label className="hint-label">
          { labelText }
          <ToolTip
            className="hint-tooltip"
            content={labelHint}
          >
            <ImageIcon className="-elv-icon hint-icon" icon={QuestionMarkIcon} />
          </ToolTip>
        </label>
      );
    } else {
      label = <label>{ labelText }</label>;
    }

    return (
      <div className="-elv-input">
        { label }
        <input
          type="text"
          value={value}
          placeholder={placeholder}
          onChange={onChange}
        />
      </div>
    );
  };

  const ShowContentBrowser = () => {
    if(!showContentBrowser) { return null; }

    return (
      <ContentBrowserModal
        Close={() => setShowContentBrowser(false)}
        Select={selection => {
          setRootObject(selection.objectId);
          setRootLibrary(selection.libraryId);
          setRootName(selection.name);
        }}
        requireObject={true}
      />
    );
  };

  const fieldsForm = (
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

            <div className="-elv-input multi-input">
              <label htmlFor={field}>Paths</label>
              <div>
                {
                  paths.map((path, index) => (
                    <div className="multi-input-item" key={`${index}-${path}`}>
                      <input
                        type="text"
                        name={field}
                        placeholder="public.movies.*.title"
                        value={path}
                        onChange={event => {
                          UpdateFormValue({
                            field,
                            arrayIndex: index,
                            key: "paths",
                            value: [event.target.value]
                          });
                        }}
                      />
                      <IconButton
                        className="info-list-icon"
                        title="Remove Item"
                        icon={DeleteIcon}
                        onClick={async () => await Confirm({
                          message: "Are you sure you want to remove this item?",
                          onConfirm: () => {
                            const fieldsData = Object.assign({}, indexerFields);
                            fieldsData[field]["paths"].splice(index, 1);
                            setIndexerFields(fieldsData);
                          }
                        })}
                      />
                    </div>
                  ))
                }
                <IconButton
                  icon={AddIcon}
                  title="Add Path"
                  onClick={() => {
                    const fieldsData = Object.assign({}, indexerFields);
                    fieldsData[field]["paths"].push("");
                    setIndexerFields(fieldsData);
                  }}
                  className="info-list-icon info-list-add-icon secondary"
                />
              </div>
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

        { NoUpdateModal() }
        <div className="indexer-fields-page">
          <div className="indexer-info-container">
            <div className="object-selection-field">
              <div className="-elv-input object-selection-container">
                <label className="hint-label">
                  Site Object
                  <ToolTip
                    className="hint-tooltip"
                    content="This object will be stored in the root metadata"
                  >
                    <ImageIcon className="-elv-icon hint-icon" icon={QuestionMarkIcon} />
                  </ToolTip>
                </label>
                <div>
                  {
                    rootName &&
                    <div className="selected-item">
                      { rootName }
                      <div className="object-selection-actions">
                        <IconLink
                          className="open-object-link"
                          icon={LinkIcon}
                          label="Open object in new tab"
                          to={`/content/${rootLibrary}/${rootObject}`}
                        />
                        <IconButton
                          title="Remove Item"
                          icon={DeleteIcon}
                          onClick={async () => await Confirm({
                            message: "Are you sure you want to remove this item?",
                            onConfirm: () => {
                              setRootLibrary("");
                              setRootName("");
                              setRootObject("");
                            }
                          })}
                        />
                      </div>
                    </div>
                  }
                  <Action type="button" onClick={() => setShowContentBrowser(true)}>Select Object</Action>
                </div>
              </div>
            </div>
            {
              InputFormField({
                labelText: "Document Prefix",
                labelHint: "This will be stored in /indexer/config/indexer/arguments/document/prefix in the metadata",
                onChange: event => setDocPrefix(event.target.value),
                value: docPrefix
              })
            }
            {
              InputFormField({
                labelText: "Query Suffix",
                labelHint: "A term that is appended to all queries. This will be stored in /indexer/config/indexer/arguments/query/suffix in the metadata",
                onChange: event => setQuerySuffix(event.target.value),
                value: querySuffix
              })
            }

            <div className="form-separator" />

            <div className="-elv-input list-field-container">
              <label className="hint-label">
                Configuration Fields
                <ToolTip
                  className="hint-tooltip"
                  content="These fields will be stored in /indexer/config/indexer/arguments/fields in the metadata"
                >
                  <ImageIcon className="-elv-icon hint-icon" icon={QuestionMarkIcon} />
                </ToolTip>
              </label>
              <div>
                { fieldsForm }
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
        { ShowContentBrowser() }
      </div>
    );
  };

  return (
    <AsyncComponent
      Load={() => {
        if(
          objectStore.object.meta.indexer &&
          objectStore.object.meta.indexer.config
        ) {
          if(
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

          const documentPrefix = (
            objectStore.object.meta.indexer.config.indexer &&
            objectStore.object.meta.indexer.config.indexer.arguments &&
            objectStore.object.meta.indexer.config.indexer.arguments.document &&
            objectStore.object.meta.indexer.config.indexer.arguments.document.prefix
          );
          if(documentPrefix) {
            setDocPrefix(documentPrefix);
          }

          const querySuffix = (
            objectStore.object.meta.indexer.config.indexer &&
            objectStore.object.meta.indexer.config.indexer.arguments &&
            objectStore.object.meta.indexer.config.indexer.arguments.query &&
            objectStore.object.meta.indexer.config.indexer.arguments.query.suffix
          );

          if(querySuffix) {
            setQuerySuffix(querySuffix);
          }

          const rootObject = (
            objectStore.object.meta.indexer.config.fabric &&
            objectStore.object.meta.indexer.config.fabric.root
          );

          const ObjectMeta = async () => {
            if(rootObject) {
              const name = await objectStore.GetContentObjectMetadata({
                libraryId: rootObject.library,
                objectId: rootObject.content,
                metadataSubtree: "/name"
              });
              setRootName(name);
              setRootObject(rootObject.content);
              setRootLibrary(rootObject.library);
            }
          };

          ObjectMeta();
        }
      }}
      render={PageContent}
    />
  );
});

export default withRouter(IndexConfiguration);
