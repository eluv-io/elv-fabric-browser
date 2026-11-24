/*
import React, {useState} from "react";
import {Link} from "react-router-dom";
import UrlJoin from "url-join";
import Path from "path";
import PrettyBytes from "pretty-bytes";
import {LabelledField} from "@/components/LabelledField";
import {Redirect, Prompt} from "react-router";
import {PageHeader} from "@/components/Page";
import {DownloadFromUrl} from "@/utils/Files";
import FileBrowser from "@/components/FileBrowser";
import AppFrame from "@/components/AppFrame";
import Fabric from "@/client/Fabric";
import {Action, Confirm, Form, IconButton, LoadingElement, Modal, Tabs, ToolTip} from "elv-components-js";
import ImageIcon from "@/components/ImageIcon";
import AsyncComponent from "@/components/AsyncComponent";
import {AddressToHash, HashToAddress, Percentage} from "@/utils/Helpers";
import {observer} from "mobx-react";
import ToggleSection from "@/components/ToggleSection";
import JSONField from "@/components/JSONField";
// TODO: Remove luxon dep
import {DateTime} from "luxon";
import ContentObjectGroups from "./ContentObjectGroups";

import RefreshIcon from "@/assets/icons/refresh.svg";
import InfoIcon from "@/assets/icons/help-circle.svg";
import DeleteIcon from "@/assets/icons/trash.svg";

import Diff from "@/components/Diff";
import {ContentBrowserModal} from "@/components/ContentBrowser";
import ActionsToolbar from "@/components/ActionsToolbar";

const DownloadPart = ({libraryId, objectId, versionHash, partHash, partName, DownloadMethod}) => {
  const [progress, setProgress] = useState(undefined);

  const downloadButton = (
    <Action
      className="action-compact secondary"
      onClick={async () => {
        setProgress("0.0%");

        const downloadUrl = await DownloadMethod({
          libraryId,
          objectId,
          versionHash,
          partHash,
          callback: async ({bytesFinished, bytesTotal}) => {
            setProgress({bytesFinished, bytesTotal});
          }
        });

        await DownloadFromUrl(downloadUrl, partName || partHash);
      }}
    >
      Download
    </Action>
  );

  const downloadProgress = progress === undefined ? null :
    <span className="download-progress">
      <progress value={100 * progress.bytesFinished / progress.bytesTotal} max={100} />
      { Percentage(progress.bytesFinished, progress.bytesTotal) }
    </span>;

  return progress ? downloadProgress : downloadButton;
};

import {libraryStore} from "@/stores";
import {objectStore} from "@/stores";

class ContentObject extends React.Component {
  constructor(props) {
    super(props);

    const searchParams = new URLSearchParams(window.location.search);

    this.state = {
      appRef: React.createRef(),
      view: searchParams.get("view") || "info",
      partDownloadProgress: {},
      pageVersion: 0,
      permissionChanging: false,
      loadingVersions: false,
      currentVersionToggled: false,
      prevVersionsToggled: false,
      moreOptions: false,
      showCopyObjectModal: false,
      redirectIds: {},
      showNonOwnerCapManagement: false,
      newNonOwnerCapPublicKey: "",
      newNonOwnerCapLabel: "",
      capsVersion: false,
      refresh: false
    };

    this.PageContent = this.PageContent.bind(this);
    this.SubmitContentObject = this.SubmitContentObject.bind(this);
    this.FinalizeABRMezzanine = this.FinalizeABRMezzanine.bind(this);
    this.UpdateMetadata = this.UpdateMetadata.bind(this);
  }

  async componentDidMount() {
    this.mounted = true;

    const token = await objectStore.rootStore.client.CreateSignedToken({
      libraryId: objectStore.libraryId,
      objectId: objectStore.objectId,
      duration: 7 * 24 * 60 * 60 * 1000
    });

    this.setState({
      editorSignedToken: token,
      editorSignedTokenExpiration: new Date(
        objectStore.rootStore.client.utils.DecodeSignedToken(token).payload.exp
      ).toLocaleString()
    });

    // Wait a bit to avoid react mount-unmount bounce
    await new Promise(resolve => setTimeout(resolve, 50));
    if(!this.mounted) {
      return;
    }
  }

  componentWillUnmount() {
    this.mounted = false;
  }

  async SubmitContentObject(confirmationMessage) {
    await Confirm({
      message: confirmationMessage,
      onConfirm: async () => {
        await objectStore.PublishContentObject({
          objectId: objectStore.objectId
        });

        this.setState({pageVersion: this.state.pageVersion + 1});
      }
    });
  }

  async SaveContentObjectDraft() {
    await Confirm({
      message: "Are you sure you want to save changes to this content object?",
      onConfirm: async () => {
        await objectStore.FinalizeContentObject({
          libraryId: objectStore.libraryId,
          objectId: objectStore.objectId
        });

        await new Promise(resolve => setTimeout(resolve, 2000));

        this.setState({pageVersion: this.state.pageVersion + 1});
      }
    });
  }

  async FinalizeABRMezzanine() {
    await Confirm({
      message: "Are you sure you want to finalize this content object?",
      onConfirm: async () => {
        await objectStore.FinalizeABRMezzanine({
          libraryId: objectStore.libraryId,
          objectId: objectStore.objectId
        });

        await new Promise(resolve => setTimeout(resolve, 2000));

        this.setState({pageVersion: this.state.pageVersion + 1});
      }
    });
  }

  async DeleteContentObject() {
    await Confirm({
      message: "Are you sure you want to delete this content object?",
      onConfirm: async () => {
        await objectStore.DeleteContentObject({
          libraryId: objectStore.libraryId,
          objectId: objectStore.objectId
        });

        this.setState({deleted: true});
      }
    });
  }

  DeleteCap = async (address) => {
    await Confirm({
      message: "Are you sure you want to delete this encryption key?",
      onConfirm: async () => {
        await objectStore.DeleteOwnerCap({
          libraryId: objectStore.libraryId,
          objectId: objectStore.objectId,
          address
        });

        this.setState({capsVersion: this.state.capsVersion + 1});
      }
    });
  }

  async UpdateMetadata({metadataSubtree="/", metadata}) {
    await objectStore.UpdateMetadata({
      libraryId: objectStore.libraryId,
      objectId: objectStore.objectId,
      metadataSubtree,
      metadata
    });
  }

  DeleteVersionButton(versionHash) {
    // Don't allow deleting of last version
    if(objectStore.object.versionCount <= 0) { return null; }

    const DeleteVersion = async () => {
      await Confirm({
        message: "Are you sure you want to delete this content version?",
        onConfirm: async () => {
          await objectStore.DeleteContentObjectVersion({
            libraryId: objectStore.libraryId,
            objectId: objectStore.objectId,
            versionHash
          });

          this.setState({pageVersion: this.state.pageVersion + 1});
        }
      });
    };

    // TODO: Make this component indicate loading
    return (
      <Action
        className="danger action-compact action-wide"
        onClick={DeleteVersion}>
        Delete Content Version
      </Action>
    );
  }

  LROStatus() {
    const statuses = objectStore.object.lroStatus;

    if(!statuses || statuses.length === 0) { return; }

    const statusLabels = statuses.map(({offeringKey, status}) => {
      if(!status) { return; }

      const states = Object.values(status).map(info => info.run_state);

      if(states.includes("failed")) {
        // LRO Failed
        return (
          <LabelledField label={offeringKey}>
            Failed
          </LabelledField>
        );
      }

      if(states.every(state => state === "finished")) {
        // LRO Finished
        return (
          <React.Fragment>
            <LabelledField label={offeringKey}>
              Finished
            </LabelledField>
            <LabelledField hidden={!objectStore.object.canEdit}>
              <Action onClick={this.FinalizeABRMezzanine}>
                Finalize
              </Action>
            </LabelledField>
          </React.Fragment>
        );
      }

      const progress = Object.values(status).map(info => info.progress.percentage);
      const percentage = progress.reduce((total, percent) => total + percent, 0) / progress.length;

      return (
        <LabelledField label={offeringKey}>
          { `${percentage.toFixed(1)}%` }
        </LabelledField>
      );
    });

    return (
      <React.Fragment>
        <LabelledField label="LRO Progress" />
        { statusLabels }
      </React.Fragment>
    );
  }

  VersionSize(version) {
    if(!version || !version.parts) { return; }

    return PrettyBytes(version.parts.reduce((a, part) => a + part.size, 0));
  }

  ObjectParts(version) {
    if(!version || !version.parts || version.parts.length === 0) { return null; }

    let partNames = objectStore.object.meta["eluv-fb.parts"] || {};
    let names = {};
    Object.keys(partNames).forEach(name => {
      names[partNames[name]] = name;
    });

    const parts = (version.parts.map((part, partNumber) => {
      const download = <DownloadPart
        libraryId={objectStore.libraryId}
        objectId={objectStore.objectId}
        versionHash={version.hash}
        partHash={part.hash}
        partName={names[part.hash]}
        DownloadMethod={objectStore.DownloadPart}
      />;

      const name = names[part.hash] ? <LabelledField label="Name" value={names[part.hash]}/> : null;

      return (
        <div key={part.hash + "-" + partNumber} className="part-info">
          { name }
          <LabelledField label="Hash">
            { part.hash }
          </LabelledField>

          <LabelledField label="Size">
            { PrettyBytes(part.size) }
          </LabelledField>

          <LabelledField label="Download">
            { download }
          </LabelledField>
        </div>
      );
    }));

    return (
      <div>
        <h3>Parts</h3>
        { parts }
      </div>
    );
  }

  CommitInfo(versionHash) {
    const version = objectStore.versions[versionHash];

    if(!version.meta || !version.meta.commit || typeof version.meta.commit !== "object") { return null; }

    let {author, author_address, message, timestamp} = version.meta.commit;
    const committedAt = timestamp ? DateTime.fromISO(timestamp) : "";

    if(message && message.length > 150) {
      message = message.slice(0, 150) + "...";
    }

    return (
      <React.Fragment>
        <LabelledField label="Commit Info" />
        <div className="indented">
          <LabelledField label="Author">
            { author || author_address } { author !== author_address ? `(${author_address})` : ""}
          </LabelledField>
          <LabelledField label="Commit Message">
            { message }
          </LabelledField>
          <LabelledField label="Committed At" hidden={!timestamp}>
            { committedAt && committedAt.toLocaleString(DateTime.DATETIME_FULL_WITH_SECONDS) }
          </LabelledField>
        </div>
      </React.Fragment>
    );
  }

  ObjectVersion({versionHash, latestVersion=false}) {
    let version = objectStore.object;
    let hasPreviousVersion = objectStore.object.versionCount > 0;

    if(!latestVersion) {
      version = objectStore.versions[versionHash];
      hasPreviousVersion = ((objectStore.object.versions || []).findIndex(storeVersion => storeVersion === (versionHash)) !== (objectStore.object.versions || []).length - 1);
    }

    if(!version) { return null; }

    const typeLink = version.type ?
      <Link className="inline-link" to={UrlJoin("/content-types", version.typeInfo.id)}>
        { version.typeInfo?.name || version.typeInfo.id }
      </Link> :
      "None";

    return (
      <div className={"version-info " + (latestVersion ? "" : "indented version-visible")}>
        { latestVersion ? <h3>Latest Version</h3> : null }

        <div className="indented">
          <LabelledField label="Hash" copyValue={versionHash}>
            { versionHash }
          </LabelledField>

          <br />

          <LabelledField label="Type" hidden={version.isContentType}>
            { typeLink }
          </LabelledField>

          <LabelledField label="Type Hash" hidden={!version.type || version.isContentType} copyValue={version.type}>
            { version.type }
          </LabelledField>

          { this.CommitInfo(versionHash) }

          <br />

          <ToggleSection label="Metadata">
            <div className="indented">
              <JSONField
                json={version.meta}
                DiffComponent={
                  hasPreviousVersion ?
                    () => {
                      return (
                        <AsyncComponent
                          Load={
                            async () => {
                              await objectStore.ContentObjectVersions({
                                libraryId: objectStore.libraryId,
                                objectId: objectStore.objectId
                              });
                            }
                          }
                          render={() => <Diff json={version} />}
                        />
                      );
                    } :
                    null
                }
              />
            </div>
          </ToggleSection>

          <ToggleSection label="Parts">
            <AsyncComponent
              Load={
                async () => {
                  await objectStore.ContentObjectParts({
                    versionHash
                  });
                }
              }
              render={() => (
                <React.Fragment>
                  <LabelledField label="Total Parts">
                    { version.parts ? version.parts.length.toString() : "" }
                  </LabelledField>

                  <LabelledField label="Total size">
                    { this.VersionSize(version) }
                  </LabelledField>

                  { this.ObjectParts(version) }
                </React.Fragment>
              )}
            />
          </ToggleSection>

          <br/>

          <LabelledField hidden={!objectStore.object.isOwner}>
            { this.DeleteVersionButton(versionHash) }
          </LabelledField>
        </div>
      </div>
    );
  }

  PreviousVersions() {
    if(objectStore.object.versions.length < 2) { return null; }

    return (
      objectStore.object.versions.slice(1).map((versionHash, i) => {
        const versionNumber = (i+1 - objectStore.object.versions.length) * -1;

        return (
          <ToggleSection
            label={`Version ${versionNumber}`}
            key={`version-${versionNumber}`}
            className="version-info indented"
            toggleOpen={this.props.location.state && (versionHash === this.props.location.state.versionHash)}
          >
            <AsyncComponent
              Load={
                async () => {
                  await objectStore.ContentObjectVersion({
                    versionHash
                  });
                }
              }
              render={() => this.ObjectVersion({versionHash, versionNumber})}
            />
          </ToggleSection>
        );
      })
    );
  }

  ContractInfo() {
    let contractInfo = [];
    contractInfo.push(
      <LabelledField key="contract-address" label="Contract Address">
        <Link className="inline-link" to={UrlJoin(this.props.match.url, "contract")}>
          { objectStore.object.contractAddress }
        </Link>
      </LabelledField>
    );

    if(!objectStore.object.isContentLibraryObject && objectStore.object.customContractAddress) {
      const customContractAddress = objectStore.object.customContractAddress;

      contractInfo.push(
        <LabelledField key={"contract-" + customContractAddress} label="Custom Contract">
          <Link className="inline-link" to={UrlJoin(this.props.match.url, "custom-contract")}>
            { customContractAddress }
          </Link>
        </LabelledField>
      );
    }

    return contractInfo;
  }

  Permissions() {
    if(!objectStore.object.isNormalObject) { return; }

    const infoIcon = (
      <ToolTip className="visibility-tooltip"
        content={
          <div className="label-box">
            {
              Object.values(Fabric.permissionLevels).map(({short, description}) =>
                <LabelledField alignTop={true} key={`visibility-info-${short}`} label={short}>
                  <div>{ description }</div>
                </LabelledField>
              )
            }
          </div>
        }
      >
        <ImageIcon className="visibility-info-icon" icon={InfoIcon} />
      </ToolTip>
    );

    let info = <div>{ Fabric.permissionLevels[objectStore.object.permission].short }</div>;
    if(objectStore.object.canEdit) {
      const options = Object.keys(Fabric.permissionLevels).map(permission =>
        <option key={`visibility-option-${permission}`} value={permission}>{ Fabric.permissionLevels[permission].short }</option>
      );

      info = (
        <LoadingElement loading={this.state.permissionChanging} loadingClassname="visibility-info-loading">
          <select
            value={objectStore.object.permission}
            onChange={
              async event => {
                this.setState({permissionChanging: true});
                try {
                  await objectStore.SetPermission({
                    objectId: objectStore.objectId,
                    permission: event.target.value
                  });

                  await new Promise(resolve => setTimeout(resolve, 1000));

                  this.setState({pageVersion: this.state.pageVersion + 1});
                } finally {
                  this.setState({permissionChanging: false});
                }
              }
            }
          >
            { options }
          </select>
        </LoadingElement>
      );
    }

    return (
      <div className="visibility-info">
        { info }
        { this.state.permissionChanging ? null : infoIcon }
      </div>
    );
  }

  OwnerCapModal = () => {
    if(!this.state.showNonOwnerCapManagement) { return null; }

    const CloseModal = () => this.setState({
      showNonOwnerCapManagement: false,
      newNonOwnerCapPublicKey: "",
      newNonOwnerCapLabel: ""
    });

    return (
      <Modal closable={true} OnClickOutside={CloseModal}>
        <Form
          legend={`Create encryption key for ${objectStore.object?.name}`}
          OnComplete={CloseModal}
          OnCancel={CloseModal}
          OnSubmit={async () => {
            await objectStore.CreateNonOwnerCap({
              libraryId: objectStore.libraryId,
              objectId: objectStore.objectId,
              publicKey: this.state.newNonOwnerCapPublicKey,
              label: this.state.newNonOwnerCapLabel
            });
          }}
        >
          <div className="form-content">
            <label htmlFor="label">Label</label>
            <input
              name="label"
              required
              placeholder="Label..."
              onChange={event => this.setState({newNonOwnerCapLabel: event.target.value})}
            />
            <label htmlFor="publicKey" className="align-top">Public Key</label>
            <textarea
              name="publicKey"
              required
              placeholder="Public Key..."
              onChange={event => this.setState({newNonOwnerCapPublicKey: event.target.value})}
            />
          </div>
        </Form>
      </Modal>
    );
  }

  OwnerCapsSection = () => {
    let addCapsButton;
    if(objectStore.object.isOwner) {
      addCapsButton = (
        <LabelledField>
          <Action
            type="button"
            className="secondary"
            onClick={() => this.setState({showNonOwnerCapManagement: true})}
          >
            Add Encryption Key
          </Action>
        </LabelledField>
      );
    }

    const capKeys = Object.keys(objectStore.object.meta || {}).filter(key => key.startsWith("eluv.caps.iusr")).map(capKey => {
      const hash = capKey.split("eluv.caps.")[1];
      return HashToAddress(hash);
    });

    const caps = objectStore.object.meta.owner_caps || {};

    return (
      <div className="non-owner-caps-container">
        <ToggleSection label="Encryption Keys" toggleOpen={this.state.showNonOwnerCapManagement}>
          {addCapsButton}
          {
            capKeys.length === 0 && <div className="table-note">No encryption keys to display</div>
          }
          {
            capKeys.length > 0 ? <React.Fragment>
              <div className="table-note">NOTE: Owner keys cannot be deleted from this table</div>
              <div className="keys-table">
                <div className="header-rows">
                  <div className="table-cell">Label</div>
                  <div className="table-cell">Type</div>
                  <div className="table-cell">Address</div>
                  <div className="table-cell"></div>
                </div>
                <div className="body-rows">
                  {capKeys.map(capAddress => {
                    const isOwnerKey = !caps.hasOwnProperty(capAddress);

                    return (
                      <React.Fragment key={`${capAddress}-caps-version-${this.state.capsVersion}`}>
                        <div className="table-cell">{caps[capAddress] || "Owner"}</div>
                        <div className="table-cell">{caps.hasOwnProperty(capAddress) ? "User" : "Owner"}</div>
                        <div className="table-cell">{capAddress}</div>
                        <div className="table-cell">
                          <IconButton
                            title="Delete this key"
                            icon={DeleteIcon}
                            disabled={!objectStore.object.isOwner || isOwnerKey}
                            onClick={(event) => {
                              event.stopPropagation();
                              this.DeleteCap(capAddress);
                            }}
                            className="delete-button"
                          />
                        </div>
                      </React.Fragment>
                    );
                  })}
                </div>
              </div>
            </React.Fragment>: null
          }

        </ToggleSection>
        { this.OwnerCapModal() }
      </div>
    );
  }

  ObjectInfo() {
    const object = objectStore.object;

    let accessCharge;
    if(object.accessInfo) {
      accessCharge = (
        <LabelledField label="Access charge">
          { object.accessInfo.accessCharge }
        </LabelledField>
      );
    }

    const ownerText = object.ownerName ?
      <span>{object.ownerName}<span className="help-text">({object.owner})</span></span> :
      object.owner;

    const typeLink = object.type ?
      <Link className="inline-link" to={UrlJoin("/content-types", object.typeInfo.id)}>
        { object.typeInfo?.name || object.typeInfo.id }
      </Link> :
      "None";

    const versionSection = object.versionCount > 0 ?
      <ToggleSection
        label="Previous Versions"
        className="version-info"
        toggleOpen={this.state.prevVersionsToggled}
      >
        <AsyncComponent
          Load={
            async () => await objectStore.ContentObjectVersions({
              libraryId: objectStore.libraryId,
              objectId: objectStore.objectId
            })
          }
          render={() => (
            <>
              <br />
              { this.PreviousVersions() }
            </>
          )}
        />
      </ToggleSection> : null;

    return (
      <div className="object-info label-box">
        <LabelledField label="Name">
          { object.meta.public?.name || object.id }
        </LabelledField>

        <LabelledField
          label="Description"
          type="textarea"
        >
          { object.meta.public.description || "" }
        </LabelledField>

        { accessCharge }

        { this.LROStatus() }

        <br />

        <LabelledField label="Library ID" hidden={object.isContentType}>
          <Link className="inline-link" to={UrlJoin("/content", objectStore.libraryId)} >
            { objectStore.libraryId}
          </Link>
        </LabelledField>

        <LabelledField label="Object ID">
          { object.id }
        </LabelledField>

        <LabelledField label="Type" hidden={object.isContentType}>
          { typeLink }
        </LabelledField>

        { this.ContractInfo() }

        <LabelledField label="Owner">
          { ownerText }
        </LabelledField>

        <LabelledField label="Versions">
          { object.versionCount + 1 }
        </LabelledField>

        <LabelledField label="Permissions" alignTop={false}>
          { this.Permissions() }
        </LabelledField>

        <LabelledField label="Auth Token" copyValue={this.state.editorSignedToken} alignTop>
          <div className="auth-token">
            { this.state.editorSignedToken }
          </div>
          <div className="auth-token-expiration">
            Expires: { this.state.editorSignedTokenExpiration}
          </div>
        </LabelledField>

        <br />

        { this.OwnerCapsSection() }

        { this.ObjectVersion({versionHash: object.hash, latestVersion: true}) }

        <br />

        { versionSection }
      </div>
    );
  }

  Actions() {
    const userCapKey = `eluv.caps.iusr${AddressToHash(objectStore.currentAccountAddress)}`;
    const hasUserCap = !!(objectStore.object.meta && objectStore.object.meta[userCapKey]);

    return (
      <ActionsToolbar
        iconActions={[
          {
            className: "refresh-button",
            icon: RefreshIcon,
            label: "Refresh",
            onClick: () => this.setState({pageVersion: this.state.pageVersion + 1})
          }
        ]}
        SaveDraft={() => this.SaveContentObjectDraft()}
        actions={[
          {
            label: "Back",
            type: "link",
            path: objectStore.object.isTenantObject ? "/content" : Path.dirname(this.props.match.url),
            className: "secondary"
          },
          {
            label: "Manage",
            type: "link",
            hidden: !objectStore.object.canEdit,
            path: UrlJoin(this.props.match.url, "edit"),
          },
          {
            label: "Custom Contract",
            type: "link",
            hidden: !objectStore.object.canEdit || objectStore.object.customContractAddress || !(objectStore.object.isNormalObject || objectStore.object.isContentType),
            path: UrlJoin(this.props.match.url, "deploy"),
          },
          {
            label: "Upload Parts",
            type: "link",
            hidden: !objectStore.object.canEdit,
            path: UrlJoin(this.props.match.url, "upload")
          },
          {
            label: "Apps",
            type: "link",
            hidden: !objectStore.object.canEdit,
            path: UrlJoin(this.props.match.url, "apps")
          },
          {
            label: "Copy",
            type: "button",
            hidden: !objectStore.object.canEdit,
            disabled: !(objectStore.object.isOwner || hasUserCap),
            onClick: () => this.setState({showCopyObjectModal: true}),
            title: !(objectStore.object.isOwner || hasUserCap) ? "You don't have the key" : undefined
          },
          {
            label: "Delete",
            type: "button",
            hidden: (
              objectStore.object.isContentLibraryObject ||
              (objectStore.object.isV3 && !libraryStore.library || !!libraryStore.library && !libraryStore.library.isManager) ||
              (!objectStore.object.isV3 && !objectStore.object.isOwner)
            ),
            onClick: () => this.DeleteContentObject(),
            className: "danger",
            dividerAbove: true
          }
        ]}
      />
    );
  }

  AppFrame() {
    if(!this.state.displayAppUrl) { return null; }

    const queryParams = {
      contentSpaceId: Fabric.contentSpaceId,
      libraryId: objectStore.libraryId,
      objectId: objectStore.objectId,
      versionHash: objectStore.object.hash,
      type: objectStore.type ? objectStore.type.hash : "",
      action: "display"
    };

    return (
      <AppFrame
        className="display-frame"
        appUrl={this.state.displayAppUrl}
        queryParams={queryParams}
        onComplete={() => this.setState({pageVersion: this.state.pageVersion + 1})}
        onCancel={() => this.setState({deleted: true})}
        fixedDimensions
      />
    );
  }

  Tabs() {
    let tabOptions = [
      ["Content Info", "info"],
      ["Groups", "groups"],
      ["Files", "files"]
    ];

    if(
      !objectStore.object.isContentType &&
      this.state.displayAppUrl ||
      (objectStore.object.meta &&
      objectStore.object.meta.hasOwnProperty("offerings"))
    ) {
      tabOptions.unshift(["Display", "display"]);
    }

    return (
      <Tabs
        options={tabOptions}
        selected={this.state.view}
        onChange={(value) => this.setState({view: value})}
      />
    );
  }

  CopyObject = async (object) => {
    const originalObject = object.versionHash ? object : objectStore.object;

    const {id, qlib_id} = await objectStore.CopyContentObject({
      libraryId: object.libraryId,
      originalVersionHash: originalObject.versionHash || originalObject.hash,
      options: {
        meta: {
          public: {
            name: `${originalObject?.name} (copy)`
          }
        }
      }
    });

    this.setState({
      redirectIds: {
        objectId: id,
        libraryId: qlib_id
      }
    });
  }

  PageContent() {
    if(this.state.deleted) {
      return <Redirect push to={Path.dirname(this.props.match.url)} />;
    }

    if(this.state.redirectIds.objectId && this.state.redirectIds.libraryId) {
      return <Redirect to={`/content/${this.state.redirectIds.libraryId}/${this.state.redirectIds.objectId}`} />;
    }

    let header;
    if(objectStore.object.isTenantObject) {
      header = "Tenant Object";
    } else if(objectStore.object.isContentLibraryObject) {
      header = libraryStore.library?.name + " > Library Object";
    } else if(objectStore.object.isContentType) {
      header = "Content Types > " + objectStore.object?.name;
    } else {
      header = (libraryStore.library ? libraryStore.library.name : objectStore.libraryId) + " > " + objectStore.object.name;
    }

    let pageContent;
    if(this.state.view === "display") {
      pageContent = this.AppFrame();
    } else if(this.state.view === "groups") {
      pageContent = (
        <ContentObjectGroups
          currentPage="contentObject"
          showGroupPermissionsButton={objectStore.object.isOwner || (objectStore.object.isNormalObject && objectStore.object.permission !== "owner" && objectStore.object.canEdit)}
          RefreshCallback={() => this.setState({refresh: true, pageVersion: this.state.pageVersion + 1})}
          LoadGroupPermissions={async () => {
            await objectStore.ContentObjectGroupPermissions({objectId: objectStore.objectId});
            await objectStore.ContentObjectUserPermissions({
              objectId: objectStore.objectId,
              libraryId: objectStore.libraryId
            });
          }}
        />
      );
    } else if(this.state.view === "info") {
      pageContent = (
        <React.Fragment>
          { this.ObjectInfo() }
        </React.Fragment>
      );
    } else {
      pageContent = (
        <div className="object-files">
          <FileBrowser
            GetFileUrl={async ({filePath}) => await objectStore.GetFileUrl({
              libraryId: objectStore.libraryId,
              objectId: objectStore.objectId,
              writeToken: objectStore.writeTokens[objectStore.objectId],
              filePath
            })}
            DownloadFile={async ({filePath, callback}) => {
              await objectStore.DownloadFile({
                libraryId: objectStore.libraryId,
                objectId: objectStore.objectId,
                writeToken: objectStore.writeTokens[objectStore.objectId],
                filePath,
                callback
              });
            }}
            DownloadUrl={async ({filePath}) => await objectStore.DownloadUrl({
              libraryId: objectStore.libraryId,
              objectId: objectStore.objectId,
              writeToken: objectStore.writeTokens[objectStore.objectId],
              filePath,
            })}
            CreateDirectory={async ({directory}) => await objectStore.CreateDirectory({
              libraryId: objectStore.libraryId,
              objectId: objectStore.objectId,
              writeToken: objectStore.writeTokens[objectStore.objectId],
              directory
            })}
          />
        </div>
      );
    }

    return (
      <div className="page-container content-page-container">
        <Prompt
          message={"Are you sure you want to navigate away from this page? You have unsaved changes that will be lost."}
          when={!!objectStore.writeTokens[objectStore.objectId]}
        />

        { this.Actions() }

        <PageHeader header={header} subHeader={objectStore.object.description} />

        { this.Tabs() }

        <div className="page-content-container">
          <div className="page-content">
            { pageContent }
          </div>
        </div>
        {
          this.state.showCopyObjectModal ?
            <ContentBrowserModal
              Close={() => {
                if(this.mounted) {
                  this.setState({showCopyObjectModal: false});
                }
              }}
              Select={(selection) => this.CopyObject(selection)}
              requireObject={false}
              header="Select a library"
              confirmMessageCallback={({name, libraryName}) => `Are you sure you want to copy ${name} into ${libraryName}?`}
            /> : null
        }
      </div>
    );
  }

  CheckUrlVersionHash() {
    const urlVersionHash = this.props.location.state && this.props.location.state.versionHash;

    if(!urlVersionHash) { return; }

    if(urlVersionHash === objectStore.object.hash) {
      this.setState({currentVersionToggled: true});
    } else {
      this.setState({prevVersionsToggled: true});
    }
  }

  render() {
    return (
      <AsyncComponent
        key={`object-page-${this.state.pageVersion}`}
        Load={
          async () => {
            objectStore.DiscardWriteToken({objectId: objectStore.objectId});

            try {
              await libraryStore.ContentLibrary({
                libraryId: objectStore.libraryId
              });
            } catch(error) {
              // eslint-disable-next-line no-console
              console.error(error);
            }

            try {
              await objectStore.ContentObject({
                libraryId: objectStore.libraryId,
                objectId: objectStore.objectId,
                refresh: this.state.refresh
              });
            } catch(error) {
              // eslint-disable-next-line no-console
              console.error(error);
              throw error;
            }

            try {
              await objectStore.ContentObjectUserPermissions({
                objectId: objectStore.objectId,
                libraryId: objectStore.libraryId
              });
            } catch(error) {
              // eslint-disable-next-line no-console
              console.error(error);
            }

            this.CheckUrlVersionHash();

            this.setState({
              displayAppUrl:
                objectStore.object.displayAppUrl ||
                (objectStore.object.typeInfo || {}).displayAppUrl,
              refresh: false
            });
          }
        }
        render={this.PageContent}
      />
    );
  }
}

export default observer(ContentObject);


 */

import ContentObjectStyles from "@/assets/stylesheets/modules/content-object.module.scss";

import {observer} from "mobx-react";
import {useLocation, useParams, useRouter} from "wouter";
import {useEffect, useState} from "react";
import AsyncComponent from "@/components/AsyncComponent";
import {libraryStore, objectStore, rootStore} from "@/stores";
import {
  Button, Confirm,
  CopyableField,
  IconButton,
  LabelledField,
  Linkish,
  PageHeader,
  ToggleSection
} from "@/components/Components";
import {Select, Tabs, Textarea, TextInput, Tooltip} from "@mantine/core";
import ActionsToolbar from "@/components/ActionsToolbar";
import UrlJoin from "url-join";
import {CreateModuleClassMatcher, FormatDateTime, HashToAddress, Percentage} from "@/utils/Helpers";
import ImageIcon from "@/components/ImageIcon";
import Fabric from "@/client/Fabric";

import InfoIcon from "@/assets/icons/help-circle.svg";
import RefreshIcon from "@/assets/icons/refresh.svg";
import DeleteIcon from "@/assets/icons/trash.svg";
import DataTable from "@/components/DataTable";
import JSONField from "@/components/JSONField";
import PrettyBytes from "pretty-bytes";
import {DownloadFromUrl} from "@/utils/Files";
import Diff from "@/components/Diff";
import {FormModal} from "@/components/Form";
import ContentObjectGroups from "@/pages/content/ContentObjectGroups";

const S = CreateModuleClassMatcher(ContentObjectStyles);

const Actions = observer(({Reload}) => {
  const [location] = useLocation();

  const [showCopyObjectModal, setShowCopyObjectModal] = useState(false);

  return (
    <ActionsToolbar
      iconActions={[
        {
          icon: RefreshIcon,
          label: "Refresh",
          onClick: Reload
        }
      ]}
      SaveDraft={() => this.SaveContentObjectDraft()}
      actions={[
        {
          label: "Back",
          type: "link",
          path: objectStore.object.isContentType ?
            "/content-types" :
            UrlJoin("/content", objectStore.libraryId),
          variant: "secondary"
        },
        {
          label: "Manage",
          type: "link",
          hidden: !objectStore.object.canEdit,
          path: UrlJoin(location, "edit"),
        },
        {
          label: "Custom Contract",
          type: "link",
          hidden: !objectStore.object.canEdit || objectStore.object.customContractAddress || !(objectStore.object.isNormalObject || objectStore.object.isContentType),
          path: UrlJoin(location, "deploy"),
        },
        {
          label: "Upload Parts",
          type: "link",
          hidden: !objectStore.object.canEdit,
          path: UrlJoin(location, "upload")
        },
        {
          label: "Apps",
          type: "link",
          hidden: !objectStore.object.canEdit,
          path: UrlJoin(location, "apps")
        },
        {
          label: "Copy",
          type: "button",
          hidden: !objectStore.object.canEdit,
          disabled: !(objectStore.object.isOwner || hasUserCap),
          onClick: () => setShowCopyObjectModal(true),
          title: !(objectStore.object.isOwner || hasUserCap) ? "You don't have the key" : undefined
        },
        {
          label: "Delete",
          type: "button",
          hidden: (
            objectStore.object.isContentLibraryObject ||
            (objectStore.object.isV3 && !libraryStore.library || !!libraryStore.library && !libraryStore.library.isManager) ||
            (!objectStore.object.isV3 && !objectStore.object.isOwner)
          ),
          onClick: () => this.DeleteContentObject(),
          dividerAbove: true
        }
      ]}
    />
  );
});

/* Content Info */

const LROStatus = observer(() => {
  const statuses = objectStore.object.lroStatus;

  if(!statuses || statuses.length === 0) { return; }

  const statusLabels = statuses.map(({offeringKey, status}) => {
    if(!status) { return; }

    const states = Object.values(status).map(info => info.run_state);

    if(states.includes("failed")) {
      // LRO Failed
      return (
        <LabelledField key={`status-${offeringKey}`} label={offeringKey}>
          Failed
        </LabelledField>
      );
    }

    if(states.every(state => state === "finished")) {
      // LRO Finished
      return (
        <div key={`status-${offeringKey}`}>
          <LabelledField label={offeringKey}>
            Finished
          </LabelledField>
          <LabelledField hidden={!objectStore.object.canEdit}>
            <Button
              onClick={this.FinalizeABRMezzanine}>
              Finalize
            </Button>
          </LabelledField>
        </div>
      );
    }

    const progress = Object.values(status).map(info => info.progress.percentage);
    const percentage = progress.reduce((total, percent) => total + percent, 0) / progress.length;

    return (
      <LabelledField key={`status-${offeringKey}`} label={offeringKey}>
        { `${percentage.toFixed(1)}%` }
      </LabelledField>
    );
  });

  return (
    <>
      <LabelledField label="LRO Progress" />
      { statusLabels }
    </>
  );
});

const Permissions = observer(({Reload}) => {
  const {objectId} = useParams();
  const [updating, setUpdating] = useState(false);

  if(!objectStore.object.isNormalObject) { return; }

  return (
    <LabelledField label="Permissions">
      <div className={S("inline-text")}>
        <Select
          miw={250}
          loading={updating}
          disabled={!objectStore.object.canEdit || updating}
          value={objectStore.object.permission}
          data={
            Object.keys(Fabric.permissionLevels).map(permission => ({
              label: Fabric.permissionLevels[permission].short,
              value: permission
            }))
          }
          onChange={
            async newPermission => {
              setUpdating(true);
              try {
                await objectStore.SetPermission({
                  objectId,
                  permission: newPermission
                });

                await new Promise(resolve => setTimeout(resolve, 1000));

                Reload();
              } finally {
                setUpdating(false);
              }
            }
          }
        />
        <Tooltip
          label={
            <div className={S("permissions-tooltip")}>
              {
                Object.values(Fabric.permissionLevels).map(({short, description}) =>
                  <>
                    <LabelledField alignTop={true} key={`visibility-info-${short}`} label={short}>
                      { description }
                    </LabelledField>
                    <div className={S("permissions-tooltip__separator")} />
                  </>
                )
              }
            </div>
          }
        >
          <ImageIcon size="xs" icon={InfoIcon} />
        </Tooltip>
      </div>
    </LabelledField>
  );
});

const OwnerCapForm = observer(({Close}) => {
  const [formData, setFormData] = useState({label: "", publicKey: ""});
  return (
    <FormModal
      modalProps={{
        opened: true,
        centered: true
      }}
      legend={`Create encryption key for ${objectStore.object?.name}`}
      onSubmit={async () => {
        try {
          await objectStore.CreateNonOwnerCap({
            libraryId: objectStore.libraryId,
            objectId: objectStore.objectId,
            label: formData.label,
            publicKey: formData.publicKey
          });
        } catch (error) {
          if(error?.toString().toLowerCase().includes("publickey length")) {
            throw {formMessage: "Invalid Public Key"};
          }

          throw error;
        }
      }}
      Close={Close}
    >
      <TextInput
        label="Label"
        placeholder="Label..."
        required
        autoComplete="off"
        value={formData.label}
        onChange={event => setFormData({...formData, label: event.target.value})}
      />
      <Textarea
        label="Public Key"
        placeholder="Public key..."
        required
        autoComplete="off"
        value={formData.publicKey}
        onChange={event => setFormData({...formData, publicKey: event.target.value})}
      />
    </FormModal>
  );
});

const OwnerCapsSection = observer(({Reload}) => {
  const [showManage, setShowManage] = useState(false);

  const capKeys = Object.keys(objectStore.object.meta || {}).filter(key => key.startsWith("eluv.caps.iusr")).map(capKey => {
    const hash = capKey.split("eluv.caps.")[1];
    return HashToAddress(hash);
  });

  const caps = objectStore.object.meta.owner_caps || {};

  return (
    <LabelledField label="Encryption Keys" alignTop>
      <ToggleSection label="Encryption Keys">
        <div className={S("stack")}>
          {
            capKeys.length === 0 ?
              <div className="table-note">No encryption keys to display</div> :
              <DataTable
                records={capKeys}
                paginate={false}
                columns={[
                  { accessor: "label", render: capAddress => <span>{caps[capAddress] || "Owner"}</span> },
                  { accessor: "type",  render: capAddress => caps.hasOwnProperty(capAddress) ? "User" : "Owner" },
                  { accessor: "address", render: capAddress => capAddress },
                  {
                    accessor: "actions",
                    title: "",
                    render: capAddress => (
                      <IconButton
                        size="sm"
                        title="Delete this key"
                        icon={DeleteIcon}
                        disabled={!objectStore.object.isOwner || !caps.hasOwnProperty(capAddress)}
                        onClick={async (event) => {
                          event.stopPropagation();

                          await Confirm({
                            title: "Delete Encryption Key",
                            content: "Are you sure you want to delete this encryption key?",
                            onConfirm: async () => {
                              await objectStore.DeleteOwnerCap({
                                libraryId: objectStore.libraryId,
                                objectId: objectStore.objectId,
                                address: capAddress
                              });

                              Reload();
                            }
                          });
                        }}
                      />
                    )
                  }
                ]}
              />
          }

          {
            !objectStore.object.isOwner ? null :
              <Button
                type="button"
                size="sm"
                variant="outline-subtle"
                onClick={() => setShowManage(true)}
              >
                Add Encryption Key
              </Button>
          }
        </div>
      </ToggleSection>
      {
        !showManage ? null :
          <OwnerCapForm
            Close={success => {
              setShowManage(false);

              if(success) {
                Reload();
              }
            }}
          />
      }
    </LabelledField>
  );
});

const CommitInfo = observer(({versionHash}) => {
  const version = objectStore.versions[versionHash];

  if(!version.meta || !version.meta.commit || typeof version.meta.commit !== "object") { return null; }

  let {author, author_address, message, timestamp} = version.meta.commit;

  if(message && message.length > 150) {
    message = message.slice(0, 150) + "...";
  }

  return (
    <>
      <LabelledField label="Commit Info" />
      <div className={S("indented")}>
        <LabelledField label="Author" copyValue={author_address}>
          <span className={S("inline-text")}>
            <span>{ author || author_address }</span>
            {
              author === author_address ? null :
                <span className={S("help-text")}>({author_address})</span>
            }
          </span>
        </LabelledField>
        <LabelledField label="Commit Message">
          { message }
        </LabelledField>
        <LabelledField label="Committed At" hidden={!timestamp}>
          { FormatDateTime(timestamp) }
        </LabelledField>
      </div>
    </>
  );
});

const DownloadPart = observer(({libraryId, objectId, versionHash, partHash, partName, DownloadMethod}) => {
  const [progress, setProgress] = useState(undefined);

  return (
    <Button
      variant={progress ? "primary" : "outline-subtle"}
      loading={false}
      onClick={async () => {
        setProgress("0.0%");

        const downloadUrl = await DownloadMethod({
          libraryId,
          objectId,
          versionHash,
          partHash,
          callback: async ({bytesFinished, bytesTotal}) => {
            setProgress({bytesFinished, bytesTotal});
          }
        });

        await DownloadFromUrl(downloadUrl, partName || partHash);
      }}
    >
      {
        !progress ? "Download" :
          Percentage(progress.bytesFinished, progress.bytesTotal)
      }
    </Button>
  );
});

const ObjectParts = observer(({version}) => {
  if(!version || !version.parts || version.parts.length === 0) { return null; }

  return (
    <div className={S("stack")}>
      {
        version.parts.map((part, partNumber) => (
          <div key={part.hash + "-" + partNumber} className={S("indented")}>
            <LabelledField label="Hash">
              { part.hash }
            </LabelledField>

            <LabelledField label="Size">
              { PrettyBytes(part.size) }
            </LabelledField>

            <LabelledField label="Download">
              <DownloadPart
                libraryId={objectStore.libraryId}
                objectId={objectStore.objectId}
                versionHash={version.hash}
                partHash={part.hash}
                DownloadMethod={objectStore.DownloadPart}
              />
            </LabelledField>
          </div>
        ))
      }
    </div>
  );
});

const ObjectVersion = observer(({versionHash, latestVersion=false, selected}) => {
  const [ref, setRef] = useState(undefined);

  let version = objectStore.object;
  let hasPreviousVersion = objectStore.object.versionCount > 0;

  if(!latestVersion) {
    version = objectStore.versions[versionHash];
    hasPreviousVersion = ((objectStore.object.versions || []).findIndex(storeVersion => storeVersion === (versionHash)) !== (objectStore.object.versions || []).length - 1);
  }

  useEffect(() => {
    // This specific version was specified, scroll to it
    if(!selected || !ref) { return; }

    history.replaceState({...(history.state || {}), versionHash: undefined}, "");

    setTimeout(() => ref.scrollIntoView({behavior: "smooth", block: "nearest", inline: "start" }), 500);
  }, [selected, ref]);

  if(!version) { return null; }

  return (
    <div ref={setRef} className={"version-info " + (latestVersion ? "" : "indented version-visible")}>
      {
        !latestVersion ? null :
          <div className={S("section-title")}>Latest Version</div>
      }

      <div className={S("indented")}>
        <LabelledField label="Hash" copyValue={versionHash}>
          { versionHash }
        </LabelledField>

        {
          version.isContentType ? null :
            <LabelledField label="Type">
              {
                !version.type ? "None" :
                  <span className={S("inline-text")}>
                    <Linkish className={S("inline-link")} to={UrlJoin("/content-types", version.typeInfo.id)}>
                      { version.typeInfo?.name || version.typeInfo.id }
                    </Linkish>
                    <CopyableField value={version.typeInfo.id} className={S("help-text")}>
                      ({version.typeInfo.id})
                    </CopyableField>
                  </span>
              }
            </LabelledField>
        }

        <CommitInfo versionHash={versionHash} />

        <br />

        <ToggleSection label="Metadata">
          <JSONField
            json={version.meta}
            className={S("component")}
            DiffComponent={
              !hasPreviousVersion ? null :
                () => <Diff json={version} />
            }
          />
        </ToggleSection>

        <ToggleSection label="Parts" indent>
          <AsyncComponent
            Load={
              async () => {
                await objectStore.ContentObjectParts({
                  versionHash
                });
              }
            }
            render={() => (
              <>
                <LabelledField label="Total Parts">
                  { version.parts ? version.parts.length.toString() : "" }
                </LabelledField>

                <LabelledField label="Total size">
                  { PrettyBytes((version.parts || []).reduce((a, part) => a + part.size, 0)) }
                </LabelledField>

                <ObjectParts version={version} />
              </>
            )}
          />
        </ToggleSection>

        <br/>

        <LabelledField hidden={!objectStore.object.isOwner}>
          {
            //this.DeleteVersionButton(versionHash)
          }
        </LabelledField>
      </div>
    </div>
  );
});

const PreviousVersions = observer(({urlVersionHash}) => {
  if(objectStore.object.versions.length < 2) { return null; }

  return (
    objectStore.object.versions.slice(1).map((versionHash, i) => {
      const versionNumber = (i+1 - objectStore.object.versions.length) * -1;

      return (
        <ToggleSection
          label={`Version ${versionNumber}`}
          key={`version-${versionNumber}`}
          toggleOpen={urlVersionHash && urlVersionHash === versionHash}
        >
          <AsyncComponent
            Load={
              async () => {
                await objectStore.ContentObjectVersion({
                  versionHash
                });
              }
            }
            render={() =>
              <ObjectVersion
                versionHash={versionHash}
                selected={urlVersionHash && urlVersionHash === versionHash}
              />
            }
          />
        </ToggleSection>
      );
    })
  );
});

const ObjectInfo = observer(({tokenInfo, Reload}) => {
  const [location] = useLocation();
  const object = objectStore.object;

  const urlVersionHash = history.state?.versionHash;

  return (
    <div>
      <LabelledField label="Name">
        {object.meta.public?.name || object.id}
      </LabelledField>

      <LabelledField
        label="Description"
        type="textarea"
      >
        {object.meta.public.description || ""}
      </LabelledField>

      {
        !object.accessInfo || !parseInt(object.accessInfo.accessCharge) ? null :
          <LabelledField label="Access charge">
            {object.accessInfo.accessCharge}
          </LabelledField>
      }

      <LROStatus/>

      <br/>

      <LabelledField label="Library ID" hidden={object.isContentType}>
        <Linkish className={S("inline-link")} to={UrlJoin("/content", objectStore.libraryId)}>
          {objectStore.libraryId}
        </Linkish>
      </LabelledField>

      <LabelledField label="Object ID">
        {object.id}
      </LabelledField>

      <LabelledField label="Type" hidden={object.isContentType}>
        {
          !object.type ? "None" :
            <span className={S("inline-text")}>
              <Linkish className={S("inline-link")} to={UrlJoin("/content-types", object.typeInfo.id)}>
                {object.typeInfo?.name || object.typeInfo.id}
              </Linkish>
              <CopyableField value={object.typeInfo.id} className={S("help-text")}>
                ({object.typeInfo.id})
              </CopyableField>
            </span>
        }
      </LabelledField>

      <LabelledField key="contract-address" label="Contract Address">
        <Linkish className="inline-link" to={UrlJoin(location, "contract")}>
          {objectStore.object.contractAddress}
        </Linkish>
      </LabelledField>

      {
        objectStore.object.isContentLibraryObject ||
        !objectStore.object.customContractAddress ? null :
          <LabelledField label="Custom Contract">
            <Linkish className={S("inline-link")} to={UrlJoin(location, "custom-contract")}>
              {objectStore.object.customContractAddress}
            </Linkish>
          </LabelledField>
      }

      <LabelledField label="Owner" copyValue={object.owner}>
        {
          object.ownerName ?
            <span className={S("inline-text")}>
              <span>{object.ownerName}</span>
              <span className={S("help-text")}>
                ({object.owner})
              </span>
            </span> :
            object.owner
        }
      </LabelledField>

      <LabelledField label="Versions">
        {object.versionCount + 1}
      </LabelledField>

      <LabelledField label="Auth Token" alignTop>
        <div className={S("auth-token")}>
          <CopyableField value={tokenInfo?.token} className={S("auth-token__token-container")}>
            <div className={S("auth-token__token", "ellipsis")}>
              {tokenInfo?.token || ""}
            </div>
          </CopyableField>
          <div className={S("auth-token__expiration")}>
            Expires: {tokenInfo?.expiration || ""}
          </div>
        </div>
      </LabelledField>
      <Permissions Reload={Reload}/>
      <br/>

      <OwnerCapsSection Reload={Reload}/>

      <div style={{marginTop: 20}} className={S("separator")}/>

      <ObjectVersion versionHash={object.hash} latestVersion/>

      <br/>

      {
        object.versionCount === 0 ? null :
          <>
            <div className={S("section-title")}>Previous Versions</div>
            <ToggleSection
              label="Previous Versions"
              className="version-info"
              toggleOpen={urlVersionHash && urlVersionHash !== objectStore.object.hash}
            >
              <AsyncComponent
                Load={
                  async () => await objectStore.ContentObjectVersions({
                    libraryId: objectStore.libraryId,
                    objectId: objectStore.objectId
                  })
                }
                render={() => <PreviousVersions urlVersionHash={urlVersionHash}/>}
              />
            </ToggleSection>
          </>
      }
    </div>
  );
});

const PageContent = observer(({Reload}) => {
  const displayAppUrl = objectStore?.object?.displayAppUrl || (objectStore?.object?.typeInfo || {}).displayAppUrl;

  const {objectId} = useParams();
  const [tab, setTab] = useState("content");
  const [tokenInfo, setTokenInfo] = useState(undefined);

  useEffect(() => {
    objectStore.rootStore.client.CreateSignedToken({
      libraryId: objectStore.libraryId,
      objectId: objectStore.objectId,
      duration: 7 * 24 * 60 * 60 * 1000
    })
      .then(token => setTokenInfo({
        token,
        expiration: new Date(
          rootStore.client.utils.DecodeSignedToken(token).payload.exp
        ).toLocaleString()
      }));
  }, [objectId]);

  if(!libraryStore.library) { return; }

  return (
    <div className="page-container">
      <Actions Reload={Reload} />
      <PageHeader
        header={`${libraryStore.library.name || objectStore.libraryId} / ${objectStore.object.name || objectId}`}
        subHeader={<CopyableField value={objectId}>{objectId}</CopyableField>}
      />
      <Tabs my="md" value={tab} onChange={setTab}>
        <Tabs.List>
          {
            !(
              !objectStore.object.isContentType &&
              displayAppUrl ||
              (objectStore.object.meta && objectStore.object.meta.hasOwnProperty("offerings"))
            ) ? null :
              <Tabs.Tab value="display">Display</Tabs.Tab>
          }
          <Tabs.Tab value="content">Content Info</Tabs.Tab>
          <Tabs.Tab value="groups">Access Groups</Tabs.Tab>
          <Tabs.Tab value="files">Files</Tabs.Tab>
        </Tabs.List>
      </Tabs>
      {
        tab === "content" ?
          <ObjectInfo tokenInfo={tokenInfo} Reload={Reload} /> :
          tab === "groups" ?
            <ContentObjectGroups
              type="contentObject"
            /> : null
      }
    </div>
  );
});

const ContentObjectPage = observer(() => {
  const {objectId} = useParams();
  const [reloadKey, setReloadKey] = useState(Math.random());

  return (
    <AsyncComponent
      key={`page-${reloadKey}`}
      Load={async () => {
        objectStore.DiscardWriteToken({objectId});

        try {
          await libraryStore.ContentLibrary({libraryId: objectStore.libraryId});
        } catch(error) {
          console.error(error);
        }

        try {
          await objectStore.ContentObject({
            libraryId: objectStore.libraryId,
            objectId,
            refresh: reloadKey > 1
          });
        } catch(error) {
          console.error(error);
          throw error;
        }

        try {
          await objectStore.ContentObjectUserPermissions({
            libraryId: objectStore.libraryId,
            objectId: objectStore.objectId
          });
        } catch(error) {
          console.error(error);
        }
      }}
      render={() =>
        <PageContent
          Reload={() => {
            libraryStore.ClearLibraryCache({libraryId: objectStore.libraryId});
            setReloadKey(reloadKey + 1);
          }}
        />
      }
    />
  );
});

export default ContentObjectPage;
