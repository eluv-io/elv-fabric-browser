import React from "react";
import PropTypes from "prop-types";
import {Link} from "react-router-dom";
import UrlJoin from "url-join";
import Path from "path";
import PrettyBytes from "pretty-bytes";
import { LabelledField } from "../../components/LabelledField";
import DashVideo from "../DashVideo";
import Redirect from "react-router/es/Redirect";
import ClippedText from "../../components/ClippedText";
import {PageHeader} from "../../components/Page";
import {DownloadFromUrl} from "../../../utils/Files";
import FileBrowser from "../../components/FileBrowser";
import AppFrame from "../../components/AppFrame";
import Fabric from "../../../clients/Fabric";
import {Action, Confirm, LoadingElement, Tabs} from "elv-components-js";
import {AccessChargeDisplay} from "../../../utils/Helpers";

class ContentObject extends React.Component {
  constructor(props) {
    super(props);

    const typeInfo = props.object.typeInfo || {};

    let initialView = "info";
    const displayAppUrl = props.object.displayAppUrl || (typeInfo.displayAppUrl);

    if(props.view) {
      initialView = props.view;
    } else if((displayAppUrl || props.object.videoUrl) && !props.object.isContentType) {
      //initialView = "display";
    }

    this.state = {
      visibleVersions: {},
      appRef: React.createRef(),
      view: initialView,
      displayAppUrl,
      typeId: typeInfo.id || "",
      typeHash: typeInfo.hash,
      typeName: (typeInfo.meta && typeInfo.meta.name) ? typeInfo.meta.name : typeInfo.hash,
      partDownloadProgress: {}
    };

    this.PageContent = this.PageContent.bind(this);
    this.SubmitContentObject = this.SubmitContentObject.bind(this);
  }

  async SubmitContentObject(confirmationMessage) {
    await Confirm({
      message: confirmationMessage,
      onConfirm: async () => {
        await this.props.methods.PublishContentObject({objectId: this.props.objectId});

        await this.props.Load({componentParams: {view: "info"}});
      }
    });
  }

  async DeleteContentObject() {
    await Confirm({
      message: "Are you sure you want to delete this content object?",
      onConfirm: async () => {
        await this.props.methods.DeleteContentObject({
          libraryId: this.props.libraryId,
          objectId: this.props.objectId
        });
      }
    });
  }

  DeleteVersionButton(versionHash) {
    // Don't allow deleting of last version
    if(this.props.object.versions.length === 1) { return null; }

    const DeleteVersion = async () => {
      await Confirm({
        message: "Are you sure you want to delete this content version?",
        onConfirm: async () => {
          await this.props.methods.DeleteContentVersion({
            libraryId: this.props.libraryId,
            objectId: this.props.objectId,
            versionHash
          });

          await this.props.Load({componentParams: {view: "info"}});
        }
      });
    };

    return (
      <LoadingElement loading={this.props.methodStatus.DeleteContentVersion.loading} loadingIcon="rotate" >
        <Action
          className="danger action-compact action-wide"
          onClick={DeleteVersion}>
          Delete Content Version
        </Action>
      </LoadingElement>
    );
  }

  ToggleVersion(hash) {
    if(hash.startsWith("hq__")) {
      this.props.methods.GetContentObjectVersion({versionHash: hash});
    }

    this.setState({
      visibleVersions: {
        ...this.state.visibleVersions,
        [hash]: !this.state.visibleVersions[hash]
      }
    });
  }

  ToggleButton(label, id) {
    const toggleVisible = () => this.ToggleVersion(id);
    const visible = this.state.visibleVersions[id];
    const toggleButtonText = (visible ? "Hide " : "Show ") + label;

    return (
      <Action className={"action-compact action-wide " + (visible ? "" : "secondary")} onClick={toggleVisible}>
        { toggleButtonText }
      </Action>
    );
  }

  PublishButton() {
    if(!this.props.object.isNormalObject) { return null; }

    const reviewerGroups = this.props.library.groups.reviewer;
    const reviewRequired = reviewerGroups.length > 0;

    if(this.props.object.status.code < 0 && this.props.object.isOwner) {
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

    if(this.props.object.status.code > 0 && this.props.object.permissions.canReview) {
      return (
        <Action type="link" to={UrlJoin(this.props.match.url, "review")}>
          Review
        </Action>
      );
    }
  }

  VersionSize(version) {
    return PrettyBytes(version.parts.reduce((a, part) => a + part.size, 0));
  }

  ToggleSection(label, id, value, format=true) {
    const visible = this.state.visibleVersions[id];

    let content;
    if(visible) {
      if(format) {
        content = <pre className="content-object-data">{JSON.stringify(value, null, 2)}</pre>;
      } else { content = value; }
    }

    return (
      <div className="formatted-data">
        <LabelledField label={label}>
          { this.ToggleButton(label, id) }
        </LabelledField>
        { content }
      </div>
    );
  }

  ObjectMedia() {
    let image;
    let video;

    if(this.props.object.imageUrl) {
      image = (
        <div className="object-image">
          <img src={this.props.object.imageUrl} />
        </div>
      );
    }

    if(this.props.object.meta["offering.en"]) {
      video = (
        <div className="object-video">
          <DashVideo videoUrl={this.props.object.imageUrl} />
        </div>
      );
    }

    if(!image && !video) {
      return null;
    } else {
      return (
        <div className="object-media">
          {video}
          {image}
        </div>
      );
    }
  }

  ObjectParts(version) {
    if(!version.parts || version.parts.length === 0) { return null; }

    let partNames = this.props.object.meta["eluv-fb.parts"] || {};
    let names = {};
    Object.keys(partNames).forEach(name => {
      names[partNames[name]] = name;
    });

    const parts = (version.parts.map((part, partNumber) => {
      const downloadButton = (
        <Action
          className="action-compact secondary"
          onClick={async () => {
            const downloadUrl = await this.props.DownloadPart({
              libraryId: this.props.libraryId,
              objectId: this.props.objectId,
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
      await this.props.DownloadFile({
        libraryId: this.props.libraryId,
        objectId: this.props.objectId,
        filePath
      });
    };

    const uploadMethod = async (path, fileList) => {
      await this.props.methods.UploadFiles({
        libraryId: this.props.libraryId,
        objectId: this.props.objectId,
        path,
        fileList
      });
    };

    const urlMethod = async (filePath) => {
      return await this.props.FileUrl({
        libraryId: this.props.libraryId,
        objectId: this.props.objectId,
        filePath
      });
    };

    return (
      <div className="object-files">
        <h3>Files</h3>
        <FileBrowser
          files={this.props.object.meta.files || {}}
          Reload={() => this.props.Load({componentParams: {view: "files"}})}
          uploadStatus={this.props.methodStatus.UploadFiles}
          Upload={uploadMethod}
          Download={downloadMethod}
          FileUrl={urlMethod}
        />
      </div>
    );
  }

  ObjectVersion(version, versionNumber, latestVersion=false) {
    const visible = latestVersion || this.state.visibleVersions[version.hash];

    let versionHeader;
    if(!latestVersion) {
      versionHeader = (
        <LabelledField label={"Version " + versionNumber}>
          { this.ToggleButton("Version", version.hash) }
        </LabelledField>
      );
    } else {
      versionHeader = <h3>{"Latest Version"}</h3>;
    }

    if(!visible) {
      return (
        <div key={"version-" + versionNumber} className="version-info indented">
          { versionHeader }
        </div>
      );
    }

    return (
      <div key={"version-" + versionNumber} className={"version-info " + (latestVersion ? "" : "indented version-visible")}>
        { versionHeader }

        <div className="indented">
          <LabelledField label="Hash" copyValue={version.hash}>
            { version.hash }
          </LabelledField>

          <LabelledField label="Parts">
            { version.parts.length }
          </LabelledField>

          <LabelledField label="Total size">
            { this.VersionSize(version) }
          </LabelledField>

          { this.ToggleSection("Metadata", "metadata-" + versionNumber, version.meta) }
          { this.ToggleSection("Verification", "verification-" + versionNumber, version.verification) }
          { this.ToggleSection("Parts", "parts-" + versionNumber, this.ObjectParts(version), false) }

          <br/>

          <LabelledField hidden={!this.props.object.isOwner}>
            { this.DeleteVersionButton(version.hash) }
          </LabelledField>
        </div>
      </div>
    );
  }

  PreviousVersions() {
    if(this.props.object.versions.length < 2) { return null; }

    return (
      <div>
        <h3>Previous Versions</h3>

        { this.props.object.versions.slice(1).map((version, i) => {
          const versionNumber = (i+1 - this.props.object.versions.length) * -1;
          return this.ObjectVersion(version, versionNumber);
        })}
      </div>
    );
  }

  ContractInfo() {
    let contractInfo = [];
    contractInfo.push(
      <LabelledField key="contract-address" label="Contract Address">
        <Link className="inline-link" to={UrlJoin(this.props.match.url, "contract")}>
          { this.props.object.contractAddress }
        </Link>
      </LabelledField>
    );

    if(!this.props.object.isContentLibraryObject && this.props.object.customContractAddress) {
      const customContractAddress = this.props.object.customContractAddress;

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
    if(!this.props.object.isNormalObject) { return null; }

    let reviewNote, reviewer;
    if(this.props.object.meta["eluv.reviewNote"]) {
      reviewer = (
        <LabelledField label="Reviewer">
          { this.props.object.meta["eluv.reviewer"] }
        </LabelledField>
      );
      const note = <ClippedText className="object-description" text={this.props.object.meta["eluv.reviewNote"]} />;
      reviewNote = (
        <LabelledField label="Review Note">
          { note }
        </LabelledField>
      );
    }

    return (
      <div>
        <LabelledField label="Status">
          { this.props.object.status.description }
        </LabelledField>
        { reviewer }
        { reviewNote }
      </div>
    );
  }

  ObjectInfo() {
    const latestVersion = this.props.object.versions[0];
    const description = <ClippedText className="object-description" text={this.props.object.description} />;
    let accessCharge;
    if(this.props.object.accessInfo) {
      accessCharge = (
        <LabelledField label="Access charge">
          { AccessChargeDisplay(this.props.object.accessInfo.accessCharge) }
        </LabelledField>
      );
    }

    const ownerText = this.props.object.ownerName ?
      <span>{this.props.object.ownerName}<span className="help-text">({this.props.object.owner})</span></span> :
      this.props.object.owner;

    return (
      <div className="object-info label-box">
        <LabelledField label="Name">
          { this.props.object.name }
        </LabelledField>

        <LabelledField label="Description" alignTop={true}>
          { description }
        </LabelledField>

        { accessCharge }

        <br />

        <LabelledField label="Library ID" hidden={this.props.object.isContentType}>
          <Link className="inline-link" to={UrlJoin("/content", this.props.libraryId)} >{ this.props.libraryId}</Link>
        </LabelledField>

        <LabelledField label="Object ID">
          { this.props.objectId }
        </LabelledField>

        <LabelledField label="Type" hidden={this.props.object.isContentType}>
          <Link className="inline-link" to={UrlJoin("/content-types", this.state.typeId)}>
            { this.state.typeName || this.state.typeId }
          </Link>
        </LabelledField>

        <LabelledField label="Type Hash" hidden={this.props.object.isContentType} copyValue={this.state.typeHash}>
          { this.state.typeHash }
        </LabelledField>

        { this.ContractInfo() }

        <LabelledField label="Owner">
          { ownerText }
        </LabelledField>

        <br />

        <LabelledField label="Versions">
          { this.props.object.versions.length }
        </LabelledField>

        <LabelledField label="Parts">
          { latestVersion.parts.length }
        </LabelledField>

        <LabelledField label="Total size">
          { this.VersionSize(latestVersion) }
        </LabelledField>

        { this.ObjectVersion(this.props.object.versions[0], this.props.object.versions.length, true) }

        { this.PreviousVersions() }
      </div>
    );
  }

  Actions() {
    let manageAppsLink;
    if(this.props.object.isOwner) {
      manageAppsLink = (
        <Action type="link" to={UrlJoin(this.props.match.url, "apps")}>
          Apps
        </Action>
      );
    }

    let setContractButton;
    if(
      !this.props.object.customContractAddress &&
      (this.props.object.isNormalObject || this.props.object.isContentType) &&
      this.props.object.isOwner
    ) {
      setContractButton = (
        <Action type="link" to={UrlJoin(this.props.match.url, "deploy")}>
          Custom Contract
        </Action>
      );
    }

    let deleteObjectButton;
    if(!this.props.object.isContentLibraryObject) {
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
      </div>
    );
  }

  DisplayVideo() {
    return (
      <div className="video-player">
        <video poster={this.props.object.imageUrl} controls={true}>
          <source src={this.props.object.videoUrl} />
        </video>
      </div>
    );
  }

  AppFrame() {
    if(!this.state.displayAppUrl) { return null; }

    const latestVersion = this.props.object.versions[0];

    const queryParams = {
      contentSpaceId: Fabric.contentSpaceId,
      libraryId: this.props.libraryId,
      objectId: this.props.objectId,
      versionHash: latestVersion.hash,
      type: this.state.typeHash,
      action: "display"
    };

    return (
      <AppFrame
        className="display-frame"
        appUrl={this.state.displayAppUrl}
        queryParams={queryParams}
        onComplete={this.LoadObject}
        onCancel={() => this.setState({deleted: true})}
      />
    );
  }

  Tabs() {
    let tabOptions = [
      ["Content Info", "info"],
      ["Files", "files"]
    ];

    if(this.state.displayAppUrl || this.props.object.videoUrl) {
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
    if(this.props.methodStatus.DeleteContentObject.completed) {
      return <Redirect push to={Path.dirname(this.props.match.url)} />;
    }

    let header;
    if(this.props.object.isContentLibraryObject) {
      header = this.props.library.name + " > Library Object";
    } else if(this.props.object.isContentType) {
      header = "Content Types > " + this.props.object.name;
    } else {
      header = this.props.library.name + " > " + this.props.object.name;
    }

    let pageContent;
    if(this.state.view === "display") {
      if(this.state.displayAppUrl) {
        pageContent = this.AppFrame();
      } else {
        pageContent = this.DisplayVideo();
      }
    } else if(this.state.view === "info") {
      pageContent = (
        <div>
          { this.ObjectMedia() }
          { this.ObjectInfo() }
        </div>
      );
    } else {
      pageContent = this.ObjectFiles();
    }

    return (
      <div className="page-container content-page-container">
        { this.Actions() }
        <PageHeader header={header} subHeader={this.props.object.description} />
        { this.Tabs() }
        <div className="page-content">
          { pageContent }
        </div>
      </div>
    );
  }

  render() {
    const loading = this.props.methodStatus.DeleteContentObject.loading || this.props.methodStatus.PublishContentObject.loading;

    return (
      <LoadingElement
        fullPage={true}
        loading={loading}
        render={this.PageContent}
      />
    );
  }
}

ContentObject.propTypes = {
  libraryId: PropTypes.string.isRequired,
  library: PropTypes.object.isRequired,
  objectId: PropTypes.string.isRequired,
  object: PropTypes.object.isRequired,
  methods: PropTypes.shape({
    UploadFiles: PropTypes.func.isRequired,
    DeleteContentObject: PropTypes.func.isRequired,
    DeleteContentVersion: PropTypes.func.isRequired
  }),
  DownloadPart: PropTypes.func.isRequired,
  DownloadFile: PropTypes.func.isRequired,
};

export default ContentObject;
