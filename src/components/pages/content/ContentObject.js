import React, {useState} from "react";
import {Link} from "react-router-dom";
import UrlJoin from "url-join";
import Path from "path";
import PrettyBytes from "pretty-bytes";
import { LabelledField } from "../../components/LabelledField";
import {Redirect, Prompt} from "react-router";
import {PageHeader} from "../../components/Page";
import {DownloadFromUrl} from "../../../utils/Files";
import FileBrowser from "../../components/FileBrowser";
import AppFrame from "../../components/AppFrame";
import Fabric from "../../../clients/Fabric";
import {Action, Confirm, IconButton, ImageIcon, LoadingElement, Tabs, ToolTip} from "elv-components-js";
import AsyncComponent from "../../components/AsyncComponent";
import {AccessChargeDisplay, Percentage} from "../../../utils/Helpers";
import {inject, observer} from "mobx-react";
import ToggleSection from "../../components/ToggleSection";
import JSONField from "../../components/JSONField";
import {DateTime} from "luxon";
import ContentObjectGroups from "./ContentObjectGroups";

import RefreshIcon from "../../../static/icons/refresh.svg";
import InfoIcon from "../../../static/icons/help-circle.svg";
import Diff from "../../components/Diff";
import ContentLookup from "../../components/ContentLookup";
import {ContentBrowserModal} from "../../components/ContentBrowser";

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

@inject("libraryStore")
@inject("objectStore")
@observer
class ContentObject extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      appRef: React.createRef(),
      view: "info",
      partDownloadProgress: {},
      pageVersion: 0,
      permissionChanging: false,
      loadingVersions: false,
      currentVersionToggled: false,
      prevVersionsToggled: false,
      moreOptions: false,
      showCopyObjectModal: false
    };

    this.toggleRef = React.createRef();
    this.PageContent = this.PageContent.bind(this);
    this.SubmitContentObject = this.SubmitContentObject.bind(this);
    this.FinalizeABRMezzanine = this.FinalizeABRMezzanine.bind(this);
    this.UpdateMetadata = this.UpdateMetadata.bind(this);
  }

  async SubmitContentObject(confirmationMessage) {
    await Confirm({
      message: confirmationMessage,
      onConfirm: async () => {
        await this.props.objectStore.PublishContentObject({
          objectId: this.props.objectStore.objectId
        });

        this.setState({pageVersion: this.state.pageVersion + 1});
      }
    });
  }

  async SaveContentObjectDraft() {
    await Confirm({
      message: "Are you sure you want to save changes to this content object?",
      onConfirm: async () => {
        await this.props.objectStore.FinalizeContentObject({
          libraryId: this.props.objectStore.libraryId,
          objectId: this.props.objectStore.objectId
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
        await this.props.objectStore.FinalizeABRMezzanine({
          libraryId: this.props.objectStore.libraryId,
          objectId: this.props.objectStore.objectId
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
        await this.props.objectStore.DeleteContentObject({
          libraryId: this.props.objectStore.libraryId,
          objectId: this.props.objectStore.objectId
        });

        this.setState({deleted: true});
      }
    });
  }

  async UpdateMetadata({metadataSubtree="/", metadata}) {
    await this.props.objectStore.UpdateMetadata({
      libraryId: this.props.objectStore.libraryId,
      objectId: this.props.objectStore.objectId,
      metadataSubtree,
      metadata
    });
  }

  DeleteVersionButton(versionHash) {
    // Don't allow deleting of last version
    if(this.props.objectStore.object.versionCount <= 0) { return null; }

    const DeleteVersion = async () => {
      await Confirm({
        message: "Are you sure you want to delete this content version?",
        onConfirm: async () => {
          await this.props.objectStore.DeleteContentObjectVersion({
            libraryId: this.props.objectStore.libraryId,
            objectId: this.props.objectStore.objectId,
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
    const statuses = this.props.objectStore.object.lroStatus;

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
            <LabelledField hidden={!this.props.objectStore.object.canEdit}>
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

  Image() {
    if(!this.props.objectStore.object.imageUrl) { return null; }

    return (
      <div className="object-image">
        <img src={this.props.objectStore.object.imageUrl} />
      </div>
    );
  }

  ObjectParts(version) {
    if(!version || !version.parts || version.parts.length === 0) { return null; }

    let partNames = this.props.objectStore.object.meta["eluv-fb.parts"] || {};
    let names = {};
    Object.keys(partNames).forEach(name => {
      names[partNames[name]] = name;
    });

    const parts = (version.parts.map((part, partNumber) => {
      const download = <DownloadPart
        libraryId={this.props.objectStore.libraryId}
        objectId={this.props.objectStore.objectId}
        versionHash={version.hash}
        partHash={part.hash}
        partName={names[part.hash]}
        DownloadMethod={this.props.objectStore.DownloadPart}
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
    const version = this.props.objectStore.versions[versionHash];

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
    let version = this.props.objectStore.object;
    let hasPreviousVersion = this.props.objectStore.object.versionCount > 0;

    if(!latestVersion) {
      version = this.props.objectStore.versions[versionHash];
      hasPreviousVersion = ((this.props.objectStore.object.versions || []).findIndex(storeVersion => storeVersion === (versionHash)) !== (this.props.objectStore.object.versions || []).length - 1);
    }

    if(!version) { return null; }

    const typeLink = version.type ?
      <Link className="inline-link" to={UrlJoin("/content-types", version.typeInfo.id)}>
        { version.typeInfo.name || version.typeInfo.id }
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
                              await this.props.objectStore.ContentObjectVersions({
                                libraryId: this.props.objectStore.libraryId,
                                objectId: this.props.objectStore.objectId
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
                  await this.props.objectStore.ContentObjectParts({
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

          <LabelledField hidden={!this.props.objectStore.object.isOwner}>
            { this.DeleteVersionButton(versionHash) }
          </LabelledField>
        </div>
      </div>
    );
  }

  PreviousVersions() {
    if(this.props.objectStore.object.versions.length < 2) { return null; }

    return (
      this.props.objectStore.object.versions.slice(1).map((versionHash, i) => {
        const versionNumber = (i+1 - this.props.objectStore.object.versions.length) * -1;

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
                  await this.props.objectStore.ContentObjectVersion({
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
          { this.props.objectStore.object.contractAddress }
        </Link>
      </LabelledField>
    );

    if(!this.props.objectStore.object.isContentLibraryObject && this.props.objectStore.object.customContractAddress) {
      const customContractAddress = this.props.objectStore.object.customContractAddress;

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
    if(!this.props.objectStore.object.isNormalObject) { return; }

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

    let info = <div>{ Fabric.permissionLevels[this.props.objectStore.object.permission].short }</div>;
    if(this.props.objectStore.object.isOwner) {
      const options = Object.keys(Fabric.permissionLevels).map(permission =>
        <option key={`visibility-option-${permission}`} value={permission}>{ Fabric.permissionLevels[permission].short }</option>
      );

      info = (
        <LoadingElement loading={this.state.permissionChanging} loadingClassname="visibility-info-loading">
          <select
            value={this.props.objectStore.object.permission}
            onChange={
              async event => {
                this.setState({permissionChanging: true});
                try {
                  await this.props.objectStore.SetPermission({
                    objectId: this.props.objectStore.objectId,
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

  ObjectInfo() {
    const object = this.props.objectStore.object;

    let accessCharge;
    if(object.accessInfo) {
      accessCharge = (
        <LabelledField label="Access charge">
          { AccessChargeDisplay(object.accessInfo.accessCharge) }
        </LabelledField>
      );
    }

    const ownerText = object.ownerName ?
      <span>{object.ownerName}<span className="help-text">({object.owner})</span></span> :
      object.owner;

    const typeLink = object.type ?
      <Link className="inline-link" to={UrlJoin("/content-types", object.typeInfo.id)}>
        { object.typeInfo.name || object.typeInfo.id }
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
            async () => await this.props.objectStore.ContentObjectVersions({
              libraryId: this.props.objectStore.libraryId,
              objectId: this.props.objectStore.objectId
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
          { object.meta.public.name || object.id }
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
          <Link className="inline-link" to={UrlJoin("/content", this.props.objectStore.libraryId)} >
            { this.props.objectStore.libraryId}
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

        <LabelledField label="Permissions" alignTop={false}>
          { this.Permissions() }
        </LabelledField>

        <br />

        <LabelledField label="Versions">
          { object.versionCount + 1 }
        </LabelledField>

        { this.ObjectVersion({versionHash: object.hash, latestVersion: true}) }

        <br />

        { versionSection }
      </div>
    );
  }

  Actions() {
    const object = this.props.objectStore.object;

    const refreshButton = (
      <IconButton
        className="refresh-button"
        icon={RefreshIcon}
        label="Refresh"
        onClick={() => this.setState({pageVersion: this.state.pageVersion + 1})}
      />
    );

    const backButton = (
      <Action type="link" to={Path.dirname(this.props.match.url)} className="secondary">
        Back
      </Action>
    );

    if(!object.canEdit) {
      return (
        <div className="actions-wrapper">
          <div className="actions-container">
            <ContentLookup />
          </div>
          <div className="actions-container">
            { backButton }
            { refreshButton }
          </div>
        </div>
      );
    }

    let setContractButton;
    if(
      !object.customContractAddress &&
      (object.isNormalObject || object.isContentType)
    ) {
      setContractButton = (
        <Action type="link" to={UrlJoin(this.props.match.url, "deploy")}>
          Custom Contract
        </Action>
      );
    }

    let deleteObjectButton;
    if(object.isOwner && !object.isContentLibraryObject) {
      deleteObjectButton = (
        <Action className="danger" onClick={() => this.DeleteContentObject()}>
          Delete
        </Action>
      );
    }

    let saveDraftButton;
    if(this.props.objectStore.writeTokens[this.props.objectStore.objectId]) {
      saveDraftButton = (
        <Action className="important" onClick={() => this.SaveContentObjectDraft()}>
          Save Draft
        </Action>
      );
    }

    const copyObjectButton = (
      <Action className="primary" onClick={() => this.setState({showCopyObjectModal: true})}>
        Copy
      </Action>
    );

    return (
      <div className="actions-wrapper">
        <div className="actions-container">
          <ContentLookup />
        </div>
        <div className="actions-container">
          { backButton }
          <Action type="link" to={UrlJoin(this.props.match.url, "edit")}>Manage</Action>
          { setContractButton }
          <Action type="link" to={UrlJoin(this.props.match.url, "upload")}>
            Upload Parts
          </Action>
          <Action type="link" to={UrlJoin(this.props.match.url, "apps")}>
            Apps
          </Action>
          { copyObjectButton }
          { deleteObjectButton }
          { saveDraftButton }
          { refreshButton }
        </div>
      </div>
    );
  }

  AppFrame() {
    if(!this.state.displayAppUrl) { return null; }

    const queryParams = {
      contentSpaceId: Fabric.contentSpaceId,
      libraryId: this.props.objectStore.libraryId,
      objectId: this.props.objectStore.objectId,
      versionHash: this.props.objectStore.object.hash,
      type: this.props.objectStore.type ? this.props.objectStore.type.hash : "",
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

    if(!this.props.objectStore.object.isContentType && this.state.displayAppUrl) {
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
    const originalObject = object.name ? object : this.props.objectStore.object;

    await this.props.objectStore.CopyContentObject({
      libraryId: object.libraryId,
      originalVersionHash: originalObject.versionHash || originalObject.hash,
      options: {
        meta: {
          public: {
            name: `${originalObject.name} (copy)`
          }
        }
      }
    });
  }

  PageContent() {
    if(this.state.deleted) {
      return <Redirect push to={Path.dirname(this.props.match.url)} />;
    }

    let header;
    if(this.props.objectStore.object.isContentLibraryObject) {
      header = this.props.libraryStore.library.name + " > Library Object";
    } else if(this.props.objectStore.object.isContentType) {
      header = "Content Types > " + this.props.objectStore.object.name;
    } else {
      header = this.props.libraryStore.library.name + " > " + this.props.objectStore.object.name;
    }

    let pageContent;
    if(this.state.view === "display") {
      pageContent = this.AppFrame();
    } else if(this.state.view === "groups") {
      pageContent = (
        <ContentObjectGroups
          currentPage="contentObject"
          showGroupPermissionsButton={this.props.objectStore.object.isOwner || (this.props.objectStore.object.isNormalObject && this.props.objectStore.object.permission !== "owner" && this.props.objectStore.object.canEdit)}
          LoadGroupPermissions={() => this.props.objectStore.ContentObjectGroupPermissions({objectId: this.props.objectStore.objectId})}
        />
      );
    } else if(this.state.view === "info") {
      pageContent = (
        <React.Fragment>
          { this.Image() }
          { this.ObjectInfo() }
        </React.Fragment>
      );
    } else {
      pageContent = (
        <div className="object-files">
          <FileBrowser
            GetFileUrl={async ({filePath}) => await this.props.objectStore.GetFileUrl({
              libraryId: this.props.objectStore.libraryId,
              objectId: this.props.objectStore.objectId,
              writeToken: this.props.objectStore.writeTokens[this.props.objectStore.objectId],
              filePath
            })}
            SetObjectImage={async ({filePath}) => await this.props.objectStore.SetExistingObjectImage({
              libraryId: this.props.objectStore.libraryId,
              objectId: this.props.objectStore.objectId,
              filePath
            })}
            DownloadFile={async ({filePath, callback}) => await this.props.objectStore.DownloadFile({
              libraryId: this.props.objectStore.libraryId,
              objectId: this.props.objectStore.objectId,
              writeToken: this.props.objectStore.writeTokens[this.props.objectStore.objectId],
              filePath,
              callback
            })}
            DownloadUrl={async ({filePath}) => await this.props.objectStore.DownloadUrl({
              libraryId: this.props.objectStore.libraryId,
              objectId: this.props.objectStore.objectId,
              writeToken: this.props.objectStore.writeTokens[this.props.objectStore.objectId],
              filePath,
            })}
            CreateDirectory={async ({directory}) => await this.props.objectStore.CreateDirectory({
              libraryId: this.props.objectStore.libraryId,
              objectId: this.props.objectStore.objectId,
              writeToken: this.props.objectStore.writeTokens[this.props.objectStore.objectId],
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
          when={!!this.props.objectStore.writeTokens[this.props.objectStore.objectId]}
        />

        { this.Actions() }

        <PageHeader header={header} subHeader={this.props.objectStore.object.description} />

        { this.Tabs() }

        <div className="page-content-container">
          <div className="page-content">
            { pageContent }
          </div>
        </div>
        {
          this.state.showCopyObjectModal ?
            <ContentBrowserModal
              Close={() =>  this.setState({showCopyObjectModal: false})}
              Select={(selection) => this.CopyObject(selection)}
              requireObject={false}
              header="Select a library"
            /> : null
        }
      </div>
    );
  }

  CheckUrlVersionHash() {
    const urlVersionHash = this.props.location.state && this.props.location.state.versionHash;

    if(!urlVersionHash) { return; }

    if(urlVersionHash === this.props.objectStore.object.hash) {
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
            await Promise.all(
              [
                this.props.libraryStore.ContentLibrary({
                  libraryId: this.props.objectStore.libraryId
                }),
                this.props.objectStore.ContentObject({
                  libraryId: this.props.objectStore.libraryId,
                  objectId: this.props.objectStore.objectId
                })
              ]
            );

            this.CheckUrlVersionHash();

            this.setState({
              displayAppUrl:
                this.props.objectStore.object.displayAppUrl ||
                (this.props.objectStore.object.typeInfo || {}).displayAppUrl
            });
          }
        }
        render={this.PageContent}
      />
    );
  }
}

export default ContentObject;
