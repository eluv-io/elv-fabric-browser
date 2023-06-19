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

import {
  Action,
  AsyncComponent,
  BallSpin,
  Confirm,
  IconButton,
  IconLink,
  ImageIcon,
  Modal,
  ToolTip
} from "elv-components-js";
import {objectStore} from "../../../stores";
import {ContentBrowserModal} from "../../components/ContentBrowser";
import JSONField from "../../components/JSONField";
import ToggleSection from "../../components/ToggleSection";
import {LabelledField} from "../../components/LabelledField";

const SearchBox = observer(() => {
  const [currentSearchQuery, setCurrentSearchQuery] = useState("");
  const [queryResults, setQueryResults] = useState();
  const [searching, setSearching] = useState(false);

  if(
    !objectStore.object.meta ||
    !objectStore.object.meta.indexer ||
    !objectStore.object.meta.indexer.stats ||
    !objectStore.object.meta.indexer.stats.fields
  ) { return null; }

  const QueryResults = () => {
    if(!queryResults) { return null; }

    return (
      <ToggleSection label="Search Results">
        <div className="indented">
          <JSONField
            json={queryResults}
          />
        </div>
      </ToggleSection>
    );
  };

  return (
    <div className="search-box">
      <label className="search-box-label">
        Query the index
        <ToolTip
          className="hint-tooltip search-hint"
          content={"Search the following ways:\n" +
          "1. Default query: Hello World\n" +
            "    a.  matches all docs containing either “hello” or “world”, sorted by relevance\n" +
            "    b.  equivalent to Hello OR World\n" +
            "    c.  all queries are case insensitive and remove punctuation\n" +
            "2. Phrase query: \"Hello World\"\n" +
            "    a.  matches \"hello\" followed immediately by \"world\"\n" +
            "3. Field phrase query: f_speech_to_text:\"hello world\"\n" +
            "    a.  Phrase query, limited to a certain field\n" +
            "4. Field OR query: f_speech_to_text:hello OR f_speech_to_text:world\n" +
            "    a.  Similar to \"default query\" but limited to a particular field. Useful when you want to limit to a field, but also want some \"fuzziness\"\n" +
            "5. Boolean query: f_speech_to_text:\"show me the money\" AND display_title:\"Jerry Maguire\"\n" +
            "    a.  Can combine queries with AND/OR.\n" +
            "6. Range query: f_release_date:[1965-09-17 TO 1975-09-17}\n" +
          "    a.  Returns docs with field entries between a lexical range,  most useful for single term fields such as dates.\n" +
        "    b.  use [] for inclusion and {} for exclusion."}
        >
          <ImageIcon className="-elv-icon hint-icon" icon={QuestionMarkIcon} />
        </ToolTip>
      </label>
      <div className="search-flex">
        <input
          type="text"
          className="search-input"
          value={currentSearchQuery}
          onChange={event => setCurrentSearchQuery(event.target.value)}
        />
        <Action
          onClick={async () => {
            setSearching(true);
            const results = await objectStore.PerformSearch({
              libraryId: objectStore.libraryId,
              objectId: objectStore.objectId,
              terms: currentSearchQuery
            });

            setQueryResults(results);
            setSearching(false);
          }}
        >
          Search
        </Action>
      </div>
      {
        searching ?
          <div className="-elv-async-component -elv-async-component-loading">
            <BallSpin />
          </div> :
          <QueryResults />
      }
    </div>
  );
});

const SearchConfiguration = observer((props) => {
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
      onConfirm: async () => {
        const fieldsMetadata = {};

        Object.keys(indexerFields).forEach(fieldIndex => {
          const {label, paths, options, type} = indexerFields[fieldIndex];

          if(label) {
            fieldsMetadata[label] = {
              paths,
              options,
              type
            };
          }
        });

        const callback = async ({writeToken}) => {
          const replaceMetaPayload = {
            libraryId: objectStore.libraryId,
            objectId: objectStore.objectId,
            writeToken
          };

          await Promise.all([
            objectStore.ReplaceMetadata({
              ...replaceMetaPayload,
              metadataSubtree: "indexer/config/indexer/arguments/fields",
              metadata: fieldsMetadata
            }),
            objectStore.ReplaceMetadata({
              ...replaceMetaPayload,
              metadataSubtree: "indexer/config/fabric/root/content",
              metadata: rootObject
            }),
            objectStore.ReplaceMetadata({
              ...replaceMetaPayload,
              metadataSubtree: "indexer/config/fabric/root/library",
              metadata: rootLibrary
            }),
            objectStore.ReplaceMetadata({
              ...replaceMetaPayload,
              metadataSubtree: "indexer/config/indexer/type",
              metadata: "metadata-text"
            }),
            objectStore.ReplaceMetadata({
              ...replaceMetaPayload,
              metadataSubtree: "indexer/config/indexer/arguments/document/prefix",
              metadata: docPrefix
            }),
            objectStore.ReplaceMetadata({
              ...replaceMetaPayload,
              metadataSubtree: "indexer/config/indexer/arguments/query",
              metadata: querySuffix.length > 0 ? {suffix: querySuffix} : {}
            })
          ]);
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

    const lastRunHash = await objectStore.GetContentObjectMetadata({
      libraryId,
      objectId,
      metadataSubtree: "indexer/last_run"
    });

    const latestVersionHash = await objectStore.LatestVersionHash({
      objectId: rootObjectId
    });

    if(!lastRunHash || lastRunHash !== latestVersionHash) {
      await Confirm({
        message: "Are you sure you want to update search index?",
        onConfirm: async () => {
          await objectStore.UpdateIndex({
            libraryId,
            objectId,
            latestHash: latestVersionHash
          });
          setObjectId(objectId);
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
      paths: [],
      options: {},
      type: "text",
      label: ""
    };

    setIndexerFields(fieldsData);
  };

  const RemoveField = (index) => {
    const newData = {};
    const fieldsData = Object.assign({}, indexerFields || {});

    delete fieldsData[index];
    Object.values(fieldsData).forEach((object, i) => {
      newData[i] = object;
    });
    setIndexerFields(newData);
  };

  const InputFormField = ({labelText, labelHint, onChange, value, placeholder}) => {
    let label;

    if(labelHint) {
      label = (
        <label className="hint-label">
          { labelText }
          <ToolTip
            className="hint-tooltip search-hint"
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

  const configFieldForm = (
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
              <label htmlFor={field} className="hint-label">
                Label
                <ToolTip
                  className="hint-tooltip search-hint"
                  content={"The label of this searchable field (e.g., \"title\", \"synopsis\", \"release_date\"). This table can be used in search queries prefixed with \"f_\" (e.g., \"f_title\", \"f_synopsis\", \"f_release_date\")."}
                >
                  <ImageIcon className="-elv-icon hint-icon" icon={QuestionMarkIcon} />
                </ToolTip>
              </label>
              <input
                type="text"
                value={label}
                placeholder="title"
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
              <label htmlFor={field} className="hint-label">
                Paths
                <ToolTip
                  className="hint-tooltip search-hint"
                  content={"One or multiple metadata paths pointing to the metadata fields that contain the values for this field.\n" +
                  "Common examples:\n\n" +
                  "    public.asset_metadata.titles.*.*.title\n" +
                  "    public.asset_metadata.series.*.*.episodes.*.*.title\n\n" +

                  "    public.asset_metadata.titles.*.*.info.synopsis\n" +
                  "    public.asset_metadata.series.*.*.episodes.*.*.info.synopsis\n\n" +

                  "When using the site \"searchables\" feature:\n" +
                  "    site_map.searchables.*.asset_metadata.title\n" +
                  "    site_map.searchables.*.assets.*.title"}
                >
                  <ImageIcon className="-elv-icon hint-icon" icon={QuestionMarkIcon} />
                </ToolTip>
              </label>
              <div>
                {
                  paths.map((path, index) => (
                    <div className="multi-input-item" key={`${field}-path-${index}`}>
                      <input
                        type="text"
                        name={field}
                        placeholder="public.asset_metadata.titles.*.title"
                        value={path}
                        onChange={event => {
                          UpdateFormValue({
                            field,
                            arrayIndex: index,
                            key: "paths",
                            value: event.target.value
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
                    paths.push("");
                    setIndexerFields(fieldsData);
                  }}
                  className="info-list-icon info-list-add-icon secondary"
                />
              </div>
            </div>

            <div className="-elv-input -elv-select list-field-input">
              <label htmlFor={field} className="hint-label">
                Type
                <ToolTip
                  className="hint-tooltip search-hint"
                  content={"string - the field is matched in its entirety (suitable for tags and titles)\n" +
                    "text - the field is matched by individual words (suitable for synopsis and descriptions)"}
                >
                  <ImageIcon className="-elv-icon hint-icon" icon={QuestionMarkIcon} />
                </ToolTip>
              </label>
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

            <div className="-elv-input -elv-checkbox-input list-field-input">
              <label htmlFor={field} className="hint-label">
                Histogram
                <ToolTip
                  className="hint-tooltip search-hint"
                  content={"Return a histogram of all matched values. Only available for type \"string\"."}
                >
                  <ImageIcon className="-elv-icon hint-icon" icon={QuestionMarkIcon} />
                </ToolTip>
              </label>
              <div className="checkbox-container">
                <input
                  type="checkbox"
                  name={field}
                  checked={(!!options && options.stats) ? options.stats.histogram : false}
                  disabled={!type || type === "text"}
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

          </div>
        </div>
      );
    })
  );

  const FieldsForm = () => {
    return (
      <div className="indexer-fields-page">
        <h3>Settings</h3>
        <div className="indexer-info-container">
          <div className="object-selection-field">
            <div className="-elv-input object-selection-container">
              <label className="hint-label">
                Site Object
                <ToolTip
                  className="hint-tooltip search-hint"
                  content={"Select the \"site\" object containing the list(s) of titles or other media and searchable objects."}
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
              labelHint: "The object metadata path at which the searchable document is defined. Typically \"/\" to use the entire object.\n" +
                "Other common examples:\n" +
                "     /assets/* (for individual assets within a title object)",
              onChange: event => setDocPrefix(event.target.value),
              value: docPrefix
            })
          }
          {
            InputFormField({
              labelText: "Query Suffix",
              labelHint: "A term that is automatically appended to all queries.",
              onChange: event => setQuerySuffix(event.target.value),
              value: querySuffix
            })
          }

          <div className="form-separator" />

          <div className="-elv-input list-field-container">
            <label className="hint-label">
              Configuration Fields
              <ToolTip
                className="hint-tooltip search-hint"
                content={"The list of metadata fields to be indexed and available as search terms. Each field has a label (e.g., \"title\", \"synopsis\", \"release_date\") and one or multiple metadata paths pointing to the metadata fields that contain the values for this field."}
              >
                <ImageIcon className="-elv-icon hint-icon" icon={QuestionMarkIcon} />
              </ToolTip>
            </label>
            <div>
              { configFieldForm }
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
    );
  };

  const LastRunInfo = () => {
    const lastRunTime = (
      objectStore.object.meta &&
      objectStore.object.meta.indexer &&
      objectStore.object.meta.indexer.last_run_time
    );
    const lastRunHash = (
      objectStore.object.meta &&
      objectStore.object.meta.indexer &&
      objectStore.object.meta.indexer.last_run
    );

    const LastRun = () => {
      if(!lastRunHash && !lastRunTime) {
        return <div className="last-run-message">No last run data found</div>;
      }

      return (
        <>
          <LabelledField
            label="Last Run Hash"
            hidden={!lastRunHash}
            copyValue={lastRunHash}
          >
            { lastRunHash }
          </LabelledField>
          <LabelledField label="Last Run Time" hidden={!lastRunTime}>
            { lastRunTime }
          </LabelledField>
        </>
      );
    };

    const Stats = () => {
      if(
        !objectStore.object.meta ||
        !objectStore.object.meta.indexer ||
        !objectStore.object.meta.indexer.stats
      ) { return null; }

      return (
        <ToggleSection label="Stats Metadata">
          <div className="indented">
            <JSONField
              json={objectStore.object.meta.indexer.stats}
            />
          </div>
        </ToggleSection>
      );
    };

    const Errors = () => {
      if(
        !objectStore.object.meta ||
        !objectStore.object.meta.indexer ||
        !objectStore.object.meta.indexer.exceptions
      ) { return null; }

      return (
        <ToggleSection label="Errors Metadata">
          <div className="indented">
            <JSONField
              json={objectStore.object.meta.indexer.exceptions}
            />
          </div>
        </ToggleSection>
      );
    };

    return (
      <div className="last-run-section">
        <h3>Last Run Info</h3>
        <div className="label-box">
          <SearchBox />
          { LastRun() }
          { Stats() }
          { Errors() }
        </div>
      </div>
    );
  };

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
            className="secondary index-button"
            onClick={UpdateIndex}
            disabled={!rootObject}
          >
            Update Index
          </Action>
          <h1>{`Search Configuration for "${objectStore.object.name || ""}"`}</h1>
          <Action
            type="button"
            className="indexer-save-button -elv-button"
            onClick={SaveForm}
          >
            Save
          </Action>
        </div>

        { NoUpdateModal() }
        { FieldsForm() }
        { ShowContentBrowser() }
        { LastRunInfo() }
      </div>
    );
  };

  return (
    <AsyncComponent
      Load={async () => {
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

          if(rootObject) {
            const name = await objectStore.GetContentObjectMetadata({
              libraryId: rootObject.library,
              objectId: rootObject.content,
              metadataSubtree: "/public/name"
            });
            setRootName(name);
            setRootObject(rootObject.content);
            setRootLibrary(rootObject.library);
          }
        }
      }}
      render={PageContent}
    />
  );
});

export default withRouter(SearchConfiguration);
