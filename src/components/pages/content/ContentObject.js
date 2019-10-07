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
import {Action, AsyncComponent, Confirm, IconButton, Tabs, TraversableJson} from "elv-components-js";
import {AccessChargeDisplay} from "../../../utils/Helpers";
import {inject, observer} from "mobx-react";
import RefreshIcon from "../../../static/icons/refresh.svg";

const ToggleSection = ({label, children, className=""}) => {
  const [show, setShow] = useState(false);

  return (
    <div className={`formatted-data ${className || ""}`}>
      <LabelledField label={label}>
        <Action className={"action-compact action-wide " + (show ? "" : "secondary")} onClick={() => setShow(!show)}>
          { `${show ? "Hide" : "Show"} ${label}` }
        </Action>
      </LabelledField>
      { show ? children : null }
    </div>
  );
};

const JSONField = ({json}) => {
  if(!json || Object.keys(json).length === 0) {
    return <pre className="content-object-data">{JSON.stringify(json, null, 2)}</pre>;
  }

  const [showRaw, setShowRaw] = useState(false);

  const tabs = (
    <Tabs
      selected={showRaw}
      onChange={value => setShowRaw(value)}
      options={[["Formatted", false], ["Raw", true]]}
      className="secondary"
    />
  );

  const content = showRaw ?
    <pre className="content-object-data">{JSON.stringify(json, null, 2)}</pre> :
    <TraversableJson json={json} />;

  return (
    <React.Fragment>
      { tabs }
      { content }
    </React.Fragment>
  );
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
      pageVersion: 0
    };

    this.PageContent = this.PageContent.bind(this);
    this.SubmitContentObject = this.SubmitContentObject.bind(this);
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
      const downloadButton = (
        <Action
          className="action-compact secondary"
          onClick={async () => {
            const downloadUrl = await this.props.objectStore.DownloadPart({
              libraryId: this.props.objectStore.libraryId,
              objectId: this.props.objectStore.objectId,
              versionHash: version.hash,
              partHash: part.hash,
              callback: async ({bytesFinished, bytesTotal}) => {
                this.setState({
                  partDownloadProgress: {
                    ...this.state.partDownloadProgress,
                    [version.hash]: {
                      ...this.state.partDownloadProgress[version.hash],
                      [part.hash]: (bytesFinished * 100) / bytesTotal
                    }
                  }
                });
              }
            });

            await DownloadFromUrl(downloadUrl, names[part.hash] || part.hash);
          }}
        >
          Download
        </Action>
      );

      const progress = this.state.partDownloadProgress[version.hash] &&
        this.state.partDownloadProgress[version.hash][part.hash];
      const downloadProgress = progress !== undefined ?
        <span className="download-progress">
          <progress value={progress} max={100} />
          {`${progress.toFixed(1)}%`}
        </span> :
        undefined;

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
            { downloadProgress || downloadButton }
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

  ObjectFiles() {
    const downloadMethod = async (filePath) => {
      await this.props.objectStore.DownloadFile({
        libraryId: this.props.objectStore.libraryId,
        objectId: this.props.objectStore.objectId,
        filePath
      });
    };

    const uploadMethod = async (path, fileList) => {
      await this.props.objectStore.UploadFiles({
        libraryId: this.props.objectStore.libraryId,
        objectId: this.props.objectStore.objectId,
        path,
        fileList
      });
    };

    const urlMethod = async (filePath) => {
      return await this.props.objectStore.FileUrl({
        libraryId: this.props.objectStore.libraryId,
        objectId: this.props.objectStore.objectId,
        filePath
      });
    };

    return (
      <div className="object-files">
        <h3>Files</h3>
        <FileBrowser
          files={this.props.objectStore.object.meta.files || {}}
          Reload={() => this.setState({pageVersion: this.state.pageVersion + 1})}
          uploadStatus={this.props.objectStore.UploadFiles}
          Upload={uploadMethod}
          Download={downloadMethod}
          FileUrl={urlMethod}
        />
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
    const description = <ClippedText className="object-description" text={object.description} />;
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
        <LabelledField label="Name">
          { object.name }
        </LabelledField>

        <LabelledField label="Description" alignTop={true}>
          { description }
        </LabelledField>

        { accessCharge }

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
    let manageAppsLink;
    if(this.props.objectStore.object.isOwner) {
      manageAppsLink = (
        <Action type="link" to={UrlJoin(this.props.match.url, "apps")}>
          Apps
        </Action>
      );
    }

    let setContractButton;
    if(
      !this.props.objectStore.object.customContractAddress &&
      (this.props.objectStore.object.isNormalObject || this.props.objectStore.object.isContentType) &&
      this.props.objectStore.object.isOwner
    ) {
      setContractButton = (
        <Action type="link" to={UrlJoin(this.props.match.url, "deploy")}>
          Custom Contract
        </Action>
      );
    }

    let deleteObjectButton;
    if(!this.props.objectStore.object.isContentLibraryObject) {
      deleteObjectButton = (
        <Action className="danger" onClick={() => this.DeleteContentObject()}>
          Delete
        </Action>
      );
    }

    return (
      <div className="actions-container">
        <Action type="link" to={Path.dirname(this.props.match.url)} className="secondary">Back</Action>
        <Action type="link" to={UrlJoin(this.props.match.url, "edit")}>Manage</Action>
        { setContractButton }
        <Action type="link" to={UrlJoin(this.props.match.url, "upload")}>Upload Parts</Action>
        { manageAppsLink }
        { deleteObjectButton }

        <IconButton
          className="refresh-button"
          icon={RefreshIcon}
          label="Refresh"
          onClick={() => this.setState({pageVersion: this.state.pageVersion + 1})}
        />
      </div>
    );
  }

  AppFrame() {
    if(!this.state.displayAppUrl) { return null; }

    const latestVersion = this.props.objectStore.object.versions[0];

    const queryParams = {
      contentSpaceId: Fabric.contentSpaceId,
      libraryId: this.props.objectStore.libraryId,
      objectId: this.props.objectStore.objectId,
      versionHash: latestVersion.hash,
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
      pageContent = this.ObjectFiles();
    }

    return (
      <div className="page-container content-page-container">
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
