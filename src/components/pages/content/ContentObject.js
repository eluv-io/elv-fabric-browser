import React from "react";
import {Link} from "react-router-dom";
import Path from "path";
import RequestPage from "../RequestPage";
import PrettyBytes from "pretty-bytes";
import { LabelledField } from "../../components/LabelledField";
import DashVideo from "../DashVideo";
import Redirect from "react-router/es/Redirect";
import ClippedText from "../../components/ClippedText";
import {
  GetContentObjectPermissions,
  PublishContentObject
} from "../../../actions/Content";
import {FormatAddress} from "../../../utils/Helpers";
import {PageHeader} from "../../components/Page";
import {DownloadFromUrl} from "../../../utils/Files";
import FileBrowser from "../../components/FileBrowser";
import AppFrame from "../../components/AppFrame";
import Fabric from "../../../clients/Fabric";

class ContentObject extends React.Component {
  constructor(props) {
    super(props);

    const libraryId = this.props.libraryId || this.props.match.params.libraryId;
    const objectId = this.props.match.params.objectId;

    this.state = {
      libraryId,
      objectId,
      visibleVersions: {},
      appRef: React.createRef(),
    };

    this.LoadObject = this.LoadObject.bind(this);
    this.PageContent = this.PageContent.bind(this);
    this.RequestComplete = this.RequestComplete.bind(this);
    this.SubmitContentObject = this.SubmitContentObject.bind(this);
  }

  componentDidMount() {
    this.LoadObject();
  }
  
  LoadObject() {
    this.setState({
      requestId: this.props.WrapRequest({
        todo: async () => {
          await this.props.GetContentLibrary({libraryId: this.state.libraryId});

          await this.props.GetContentObject({
            libraryId: this.state.libraryId,
            objectId: this.state.objectId
          });

          await this.props.GetContentObjectVersions({
            libraryId: this.state.libraryId,
            objectId: this.state.objectId
          });

          const object = this.props.objects[this.state.objectId];
          const typeInfo = object.typeInfo;

          let displayAppUrl;
          if(typeInfo && typeInfo.meta["eluv.displayApp"]) {
            displayAppUrl = await this.props.FileUrl({
              libraryId: Fabric.contentSpaceLibraryId,
              objectId: typeInfo.id,
              filePath: typeInfo.meta["eluv.displayApp"]
            });

            this.setState({
              displayAppUrl
            });
          }

          if(object.isNormalObject) {
            // If object not yet published, need information about groups to determine
            // what actions user can do
            if(object.status !== 0) {
              await this.props.ListContentLibraryGroups({libraryId: this.state.libraryId});
            }

            this.setState({
              permissions: await GetContentObjectPermissions({
                libraryId: this.state.libraryId,
                objectId: this.state.objectId
              })
            });
          }
        }
      })
    });
  }

  RequestComplete() {
    if(this.state.deleting && this.props.requests[this.state.requestId].completed) {
      this.setState({
        deleted: true
      });
    } else if(this.state.deletingVersion) {
      this.setState({
        deletingVersion: false
      });
      // Version deleted - reload object
      this.LoadObject();
    }

    // Determine the name of the content type
    const object = this.props.objects[this.state.objectId];
    const typeInfo = object.typeInfo;
    if(object.isNormalObject && typeInfo) {
      this.setState({
        typeHash: typeInfo.hash,
        typeName: (typeInfo.meta && typeInfo.meta["eluv.name"]) ? typeInfo.meta["eluv.name"] : typeInfo.hash
      });
    }

    this.setState({
      library: this.props.libraries[this.state.libraryId],
      object
    });
  }

  SubmitContentObject(confirmationMessage) {
    if(confirm(confirmationMessage)) {
      this.setState({
        requestId: this.props.WrapRequest({
          todo: async () => {
            await PublishContentObject({objectId: this.state.objectId});

            this.LoadObject();
          },
        })
      });
    }
  }

  DeleteContentObject() {
    if(confirm("Are you sure you want to delete this content object?")) {
      this.setState({
        requestId: this.props.WrapRequest({
          todo: async () => {
            await this.props.DeleteContentObject({
              libraryId: this.state.libraryId,
              objectId: this.state.objectId
            });
          },
        }),
        deleting: true
      });
    }
  }

  DeleteContentVersion(versionHash) {
    if(confirm("Are you sure you want to delete this content version?")) {
      this.setState({
        requestId: this.props.WrapRequest({
          todo: async () => {
            await this.props.DeleteContentVersion({
              libraryId: this.state.libraryId,
              objectId: this.state.objectId,
              versionHash
            });
          }
        }),
        deletingVersion: true
      });
    }
  }

  DeleteVersionButton(versionHash) {
    // Don't allow deleting of last version
    if(this.state.object.versions.length === 1) { return null; }

    return (
      <div className="actions-container">
        <button
          className="action delete-action action-compact action-wide"
          onClick={() => this.DeleteContentVersion(versionHash)}>
          Delete Content Version
        </button>
      </div>
    );
  }

  ToggleVersion(hash) {
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
      <div className="actions-container">
        <button className={"action action-compact action-wide " + (visible ? "" : "secondary")} onClick={toggleVisible}>{ toggleButtonText }</button>
      </div>
    );
  }

  PublishButton() {
    if(!this.state.object.isNormalObject) { return null; }

    const reviewerGroups = this.state.library.groups.reviewer;
    const reviewRequired = reviewerGroups.length > 0;

    if(this.state.object.status.code < 0 && this.state.object.isOwner) {
      const actionText = reviewRequired ? "Submit for Review" : "Publish";
      const confirmationMessage = reviewRequired ?
        "Are you sure you want to submit this content object for review?" :
        "Are you sure you want to publish this content object?";

      return (
        <button
          className="action"
          onClick={() => { this.SubmitContentObject(confirmationMessage); }}
        >
          { actionText }
        </button>
      );
    }

    if(this.state.object.status.code > 0 && this.state.permissions.canReview) {
      return (
        <Link className="action" to={Path.join(this.props.match.url, "review")}>
          Review
        </Link>
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
        <LabelledField label={label} value={this.ToggleButton(label, id)} />
        { content }
      </div>
    );
  }

  ObjectMedia() {
    let image;
    let video;

    if(this.state.object.imageUrl) {
      image = (
        <div className="object-image">
          <img src={this.state.object.imageUrl} />
        </div>
      );
    }

    if(this.state.object.meta["offering.en"]) {
      video = (
        <div className="object-video">
          <DashVideo videoUrl={this.state.object.imageUrl} />
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

    const parts = (version.parts.map((part, partNumber) => {
      const downloadButton = (
        <div className="actions-container">
          <button
            className="action action-compact tertiary"
            onClick={() => {
              this.props.DownloadPart({
                libraryId: this.state.libraryId,
                objectId: this.state.objectId,
                versionHash: version.hash,
                partHash: part.hash,
                callback: async (url) => {
                  await DownloadFromUrl(url, part.hash);
                }
              });
            }}
          >
            Download
          </button>
        </div>
      );

      return (
        <div key={part.hash + "-" + partNumber} className="part-info">
          <LabelledField label={"Hash"} value={part.hash} />
          <LabelledField label={"Size"} value={PrettyBytes(part.size)} />
          <LabelledField label={"Download"} value={downloadButton} />
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
        libraryId: this.state.libraryId,
        objectId: this.state.objectId,
        filePath
      });
    };

    const uploadMethod = async (path, fileList) => {
      await this.props.UploadFiles({
        libraryId: this.state.libraryId,
        objectId: this.state.objectId,
        path,
        fileList
      });
    };

    return(
      <div className="object-files">
        <h3>Files</h3>
        <FileBrowser
          requests={this.props.requests}
          files={this.state.object.meta.files || {}}
          Reload={this.LoadObject}
          Upload={uploadMethod}
          Download={downloadMethod}
          WrapRequest={this.props.WrapRequest}
        />
      </div>
    );
  }

  ObjectVersion(version, versionNumber, latestVersion=false) {
    const visible = latestVersion || this.state.visibleVersions[version.hash];

    let versionHeader;
    if(!latestVersion) {
      versionHeader = <LabelledField label={"Version " + versionNumber} value={this.ToggleButton("Version", version.hash)} />;
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
          <LabelledField label={"Hash"} value={version.hash} />
          <LabelledField label={"Parts"} value={version.parts.length} />
          <LabelledField label={"Total size"} value={this.VersionSize(version)} />
          { this.ToggleSection("Metadata", "metadata-" + versionNumber, version.meta) }
          { this.ToggleSection("Verification", "verification-" + versionNumber, version.verification) }
          { this.ToggleSection("Parts", "parts-" + versionNumber, this.ObjectParts(version), false) }

          <br/>

          { this.DeleteVersionButton(version.hash)}
        </div>
      </div>
    );
  }

  PreviousVersions() {
    if(this.state.object.versions.length < 2) { return null; }

    return (
      <div>
        <h3>Previous Versions</h3>

        { this.state.object.versions.slice(1).map((version, i) => {
          const versionNumber = (i+1 - this.state.object.versions.length) * -1;
          return this.ObjectVersion(version, versionNumber);
        })}
      </div>
    );
  }

  ContractInfo() {
    let contractInfo = [];
    contractInfo.push(
      <LabelledField
        key={"contract-" + this.state.object.contractAddress}
        label={"Contract Address"}
        value={
          <Link className="inline-link" to={Path.join(this.props.match.url, "contract")}>
            {this.state.object.contractAddress}
          </Link>
        } />

    );

    if(!this.state.object.isContentLibraryObject && this.state.object.customContractAddress) {
      const customContractAddress = this.state.object.customContractAddress;

      contractInfo.push(
        <LabelledField
          key={"contract-" + customContractAddress}
          label={"Custom Contract"}
          value={<Link className="inline-link" to={Path.join(this.props.match.url, "custom-contract")}>{customContractAddress}</Link>} />);
    }

    return contractInfo;
  }

  // Display object status and review/submit/publish actions
  ObjectStatus() {
    if(!this.state.object.isNormalObject) { return null; }

    let reviewNote, reviewer;
    if(this.state.object.meta["eluv.reviewNote"]) {
      reviewer = <LabelledField label="Reviewer" value={this.state.object.meta["eluv.reviewer"]} />;
      const note = <ClippedText className="object-description" text={this.state.object.meta["eluv.reviewNote"]} />;
      reviewNote = <LabelledField
        label="Review Note" value={note} />;
    }

    return (
      <div>
        <LabelledField label={"Status"} value={this.state.object.status.description} />
        { reviewer }
        { reviewNote }
      </div>
    );
  }

  ObjectInfo() {
    const latestVersion = this.state.object.versions[0];
    const description = <ClippedText className="object-description" text={this.state.object.description} />;
    const header = this.state.object.isContentType ? "Content Type Info" : "Content Object Info";

    return (
      <div className="object-info label-box">
        <h3>{ header }</h3>

        <LabelledField label={"Name"} value={this.state.object.name} />
        <LabelledField label={"Type"} value={<span title={this.state.typeHash}>{this.state.typeName}</span>} hidden={this.state.object.isContentType} />
        <LabelledField label={"Description"} value={description} />
        { this.ObjectStatus() }
        <LabelledField label={"Library ID"} value={this.state.libraryId} />
        <LabelledField label={"Object ID"} value={this.state.objectId} />
        <LabelledField label={"Owner"} value={this.state.object.owner} />
        { this.ContractInfo() }
        <LabelledField label={"Versions"} value={this.state.object.versions.length} />
        <LabelledField label={"Parts"} value={latestVersion.parts.length} />
        <LabelledField label={"Total size"} value={this.VersionSize(latestVersion)} />

        { this.ObjectVersion(this.state.object.versions[0], this.state.object.versions.length, true) }

        { this.PreviousVersions() }
      </div>
    );
  }

  Actions() {
    let appLink;
    if(this.state.object.meta && this.state.object.meta.app) {
      appLink = (
        <Link to={Path.join(this.props.match.url, "app")} className="action">
          View App
        </Link>
      );
    }

    let setContractButton;
    if(
      !this.state.object.customContractAddress &&
      (this.state.object.isNormalObject || this.state.object.isContentType) &&
      this.state.object.isOwner
    ) {
      setContractButton =  <Link to={Path.join(this.props.match.url, "deploy")} className="action">Set Custom Contract</Link>;
    }

    let deleteObjectButton;
    if(!this.state.object.isContentLibraryObject) {
      deleteObjectButton = (
        <button className="action delete-action" onClick={() => this.DeleteContentObject()}>
          Delete
        </button>
      );
    }

    return (
      <div className="actions-container">
        <Link to={Path.dirname(this.props.match.url)} className="action secondary" >Back</Link>
        <Link to={Path.join(this.props.match.url, "edit")} className="action" >Manage</Link>
        { this.PublishButton() }
        { setContractButton }
        <Link to={Path.join(this.props.match.url, "upload")} className="action" >Upload Parts</Link>
        { deleteObjectButton }
        { appLink }
      </div>
    );
  }

  AppFrame() {
    if(!this.state.displayAppUrl) { return null; }

    const queryParams = {
      contentSpaceId: Fabric.contentSpaceId,
      libraryId: this.state.libraryId,
      objectId: this.state.objectId,
      type: this.props.objects[this.state.objectId].type,
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

  PageContent() {
    if(this.state.deleted) {
      return <Redirect push to={Path.dirname(this.props.match.url)} />;
    }

    const header = this.state.object.isContentLibraryObject ?
      this.state.library.name + " > Library Object" :
      this.state.library.name + " > " + this.state.object.name;

    return (
      <div className="page-container content-page-container">
        { this.Actions() }
        <div className="object-display">
          <PageHeader header={header} />
          { this.AppFrame() }
          { this.ObjectMedia() }
          { this.ObjectInfo() }
          { this.ObjectFiles() }
        </div>
      </div>
    );
  }

  render() {
    return (
      <RequestPage
        requestId={this.state.requestId}
        requests={this.props.requests}
        pageContent={this.PageContent}
        OnRequestComplete={this.RequestComplete}
      />
    );
  }
}

export default ContentObject;
