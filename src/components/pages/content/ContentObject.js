import React, {useState} from "react";
import {Link} from "react-router-dom";
import UrlJoin from "url-join";
import Path from "path";
import PrettyBytes from "pretty-bytes";
import { LabelledField } from "../../components/LabelledField";
import Redirect from "react-router/es/Redirect";
import ClippedText from "../../components/ClippedText";
import {PageHeader} from "../../components/Page";
import {DownloadFromUrl} from "../../../utils/Files";
import FileBrowser from "../../components/FileBrowser";
import AppFrame from "../../components/AppFrame";
import Fabric from "../../../clients/Fabric";
import {Action, Confirm, IconButton, Tabs} from "elv-components-js";
import AsyncComponent from "../../components/AsyncComponent";
import {AccessChargeDisplay, Percentage} from "../../../utils/Helpers";
import {inject, observer} from "mobx-react";
import RefreshIcon from "../../../static/icons/refresh.svg";
import Prompt from "react-router/es/Prompt";
import ToggleSection from "../../components/ToggleSection";
import JSONField from "../../components/JSONField";

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
      fileVersion: 0
    };

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
    if(this.props.objectStore.object.versions.length === 1) { return null; }

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

  PublishButton() {
    if(!this.props.objectStore.object.isNormalObject) { return null; }

    const reviewerGroups = this.props.libraryStore.library.groups.reviewer;
    const reviewRequired = reviewerGroups.length > 0;

    if(this.props.object.status.code < 0 && this.props.objectStore.object.isOwner) {
      const actionText = reviewRequired ? "Submit for Review" : "Publish";
      const confirmationMessage = reviewRequired ?
        "Are you sure you want to submit this content object for review?" :
        "Are you sure you want to publish this content object?";

      return (
        <Action onClick={() => this.SubmitContentObject(confirmationMessage)} >
          { actionText }
        </Action>
      );
    }

    if(this.props.objectStore.object.status.code > 0 && this.props.objectStore.object.permissions.canReview) {
      return (
        <Action type="link" to={UrlJoin(this.props.match.url, "review")}>
          Review
        </Action>
      );
    }
  }

  LROStatus() {
    const statuses = this.props.objectStore.object.lroStatus;

    if(!statuses || statuses.length === 0) { return; }

    const statusLabels = statuses.map(({offeringKey, status}) => {
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
    if(!version) { return; }

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

  ObjectVersion(versionHash, versionNumber, latestVersion=false) {
    const version = this.props.objectStore.versions[versionHash];

    return (
      <div className={"version-info " + (latestVersion ? "" : "indented version-visible")}>
        <h3>{latestVersion ? "Latest Version" : `Version ${versionNumber}`}</h3>

        <div className="indented">
          <LabelledField label="Hash" copyValue={versionHash}>
            { versionHash }
          </LabelledField>

          <LabelledField label="Parts">
            { version.parts.length.toString() }
          </LabelledField>

          <LabelledField label="Total size">
            { this.VersionSize(version) }
          </LabelledField>

          <ToggleSection label="Metadata">
            <div className="indented">
              <JSONField json={version.meta} />
            </div>
          </ToggleSection>

          <ToggleSection label="Verification">
            <pre className="content-object-data">{JSON.stringify(version.verification, null, 2)}</pre>
          </ToggleSection>

          <ToggleSection label="Parts">
            { this.ObjectParts(version) }
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
      <React.Fragment>
        <h3>Previous Versions</h3>

        { this.props.objectStore.object.versions.slice(1).map((versionHash, i) => {
          const versionNumber = (i+1 - this.props.objectStore.object.versions.length) * -1;

          return (
            <ToggleSection
              label={`Version ${versionNumber}`}
              key={`version-${versionNumber}`}
              className="version-info indented"
            >
              <AsyncComponent
                Load={
                  async () => {
                    await this.props.objectStore.ContentObjectVersion({
                      versionHash
                    });
                  }
                }
                render={() => this.ObjectVersion(versionHash, versionNumber)}
              />
            </ToggleSection>
          );
        })}
      </React.Fragment>
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

  // Display object status and review/submit/publish actions
  ObjectStatus() {
    if(!this.props.objectStore.object.isNormalObject) { return null; }

    let reviewNote, reviewer;
    if(this.props.objectStore.object.meta["eluv.reviewNote"]) {
      reviewer = (
        <LabelledField label="Reviewer">
          { this.props.objectStore.object.meta["eluv.reviewer"] }
        </LabelledField>
      );
      const note = <ClippedText className="object-description" text={this.props.objectStore.object.meta["eluv.reviewNote"]} />;
      reviewNote = (
        <LabelledField label="Review Note">
          { note }
        </LabelledField>
      );
    }

    return (
      <React.Fragment>
        <LabelledField label="Status">
          { this.props.objectStore.object.status.description }
        </LabelledField>
        { reviewer }
        { reviewNote }
      </React.Fragment>
    );
  }

  ObjectInfo() {
    const object = this.props.objectStore.object;

    const latestVersion = this.props.objectStore.versions[object.versions[0]];

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

    return (
      <div className="object-info label-box">
        <LabelledField
          label="Name"
          editable={true}
          onChange={async newName => {
            await this.UpdateMetadata({metadataSubtree: "public/name", metadata: newName});
            await this.UpdateMetadata({metadataSubtree: "name", metadata: newName});
          }}
        >
          { object.meta.public.name || object.id }
        </LabelledField>

        <LabelledField
          label="Description"
          type="textarea"
          editable={true}
          onChange={async newDescription => {
            await this.UpdateMetadata({metadataSubtree: "public/description", metadata: newDescription.trim()});
            await this.UpdateMetadata({metadataSubtree: "description", metadata: newDescription.trim()});
          }}
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

        <LabelledField label="Type Hash" hidden={!object.type || object.isContentType} copyValue={object.type}>
          { object.type }
        </LabelledField>

        { this.ContractInfo() }

        <LabelledField label="Owner">
          { ownerText }
        </LabelledField>

        <br />

        <LabelledField label="Versions">
          { object.versions.length }
        </LabelledField>

        <LabelledField label="Parts">
          { latestVersion.parts.length }
        </LabelledField>

        <LabelledField label="Total size">
          { this.VersionSize(latestVersion) }
        </LabelledField>

        { this.ObjectVersion(object.versions[0], object.versions.length, true) }

        { this.PreviousVersions() }
      </div>
    );
  }

  Actions() {
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

    if(!this.props.objectStore.object.canEdit) {
      return (
        <div className="actions-container">
          { backButton }
          { refreshButton }
        </div>
      );
    }

    let setContractButton;
    if(
      !this.props.objectStore.object.customContractAddress &&
      (this.props.objectStore.object.isNormalObject || this.props.objectStore.object.isContentType)
    ) {
      setContractButton = (
        <Action type="link" to={UrlJoin(this.props.match.url, "deploy")}>
          Custom Contract
        </Action>
      );
    }

    let deleteObjectButton;
    if(this.props.objectStore.object.isOwner && !this.props.objectStore.object.isContentLibraryObject) {
      deleteObjectButton = (
        <Action className="danger" onClick={() => this.DeleteContentObject()}>
          Delete
        </Action>
      );
    }

    let saveDraftButton;
    if(this.props.objectStore.object.writeToken) {
      saveDraftButton = (
        <Action className="important" onClick={() => this.SaveContentObjectDraft()}>
          Save Draft
        </Action>
      );
    }

    return (
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
        { deleteObjectButton }
        { saveDraftButton }
        { refreshButton }
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
            baseFileUrl={this.props.objectStore.object.baseFileUrl}
          />
        </div>
      );
    }

    return (
      <div className="page-container content-page-container">
        <Prompt
          message={"Are you sure you want to navigate away from this page? You have unsaved changes that will be lost."}
          when={!!this.props.objectStore.object.writeToken}
        />

        { this.Actions() }

        <PageHeader header={header} subHeader={this.props.objectStore.object.description} />

        { this.Tabs() }

        <div className="page-content">
          { pageContent }
        </div>
      </div>
    );
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

            await this.props.objectStore.ContentObjectVersions({
              libraryId: this.props.objectStore.libraryId,
              objectId: this.props.objectStore.objectId
            });

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
