import React from "react";
import {Link} from "react-router-dom";
import Path from "path";
import RequestPage from "../RequestPage";
import PrettyBytes from "pretty-bytes";
import { LabelledField } from "../../components/LabelledField";
import DashVideo from "../DashVideo";
import Redirect from "react-router/es/Redirect";
import Fabric from "../../../clients/Fabric";
import ClippedText from "../../components/ClippedText";

class ContentObject extends React.Component {
  constructor(props) {
    super(props);

    const libraryId = this.props.libraryId || this.props.match.params.libraryId;
    const objectId = this.props.match.params.objectId;
    const isContentType = this.props.match.url.startsWith("/content-types");
    const isLibraryObject = Fabric.utils.EqualHash(libraryId, objectId);

    this.state = {
      libraryId,
      objectId,
      visibleVersions: {},
      appRef: React.createRef(),
      isContentType,
      isLibraryObject,
      isNormalObject: !isContentType && !isLibraryObject
    };

    this.PageContent = this.PageContent.bind(this);
    this.RequestComplete = this.RequestComplete.bind(this);
  }

  componentDidMount() {
    this.LoadObject();
  }
  
  LoadObject() {
    this.setState({
      requestId: this.props.WrapRequest({
        todo: async () => {
          await this.props.GetContentObject({
            libraryId: this.state.libraryId,
            objectId: this.state.objectId
          });

          await this.props.GetContentObjectVersions({
            libraryId: this.state.libraryId,
            objectId: this.state.objectId
          });
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
      // Version deleted - reload object
      this.LoadObject();
    }
    
    this.setState({
      object: this.props.objects[this.state.objectId]
    });
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

  VersionSize(version) {
    return PrettyBytes(version.parts.reduce((a, part) => a + part.size, 0));
  }

  FormattedData(label, id, value) {
    const visible = this.state.visibleVersions[id];

    let content;

    if(visible) {
      content = <pre className="content-object-data">{JSON.stringify(value, null, 2)}</pre>;
    }

    return (
      <div className="formatted-data">
        <LabelledField label={label} value={this.ToggleButton(label, id)} />
        { content }
      </div>
    );
  }

  async Download(url, filename) {
    let element = document.createElement("a");
    element.href = url;
    element.download = filename;

    element.style.display = "none";
    document.body.appendChild(element);

    element.click();

    document.body.removeChild(element);
    window.URL.revokeObjectURL(url);
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

    return (version.parts.map((part, partNumber) => {
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
                callback: (url) => {
                  this.Download(url, part.hash);
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
          <LabelledField label={<h4>Parts</h4>} />
          <LabelledField label={"Part hash"} value={part.hash} />
          <LabelledField label={"Size"} value={PrettyBytes(part.size)} />
          <LabelledField label={"Download"} value={downloadButton} />
        </div>
      );
    }));
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
          { this.FormattedData("Metadata", "metadata-" + versionNumber, version.meta) }
          { this.FormattedData("Verification", "verification-" + versionNumber, version.verification) }
          { this.ObjectParts(version) }

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
    if(this.state.object.isLibraryObject){ return null; }

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

    if(this.state.object.meta.customContract) {
      const customContractAddress = this.state.object.meta.customContract.address.toLowerCase();
      contractInfo.push(
        <LabelledField
          key={"contract-" + customContractAddress}
          label={"Custom Contract"}
          value={<Link className="inline-link" to={Path.join(this.props.match.url, "custom-contract")}>{customContractAddress}</Link>} />);
    }

    return contractInfo;
  }

  ObjectInfo() {
    const latestVersion = this.state.object.versions[0];
    const description = <ClippedText className="object-description" text={this.state.object.description} />;
    const header = this.state.isContentType ? "Content Type Info" : "Content Object Info";

    return (
      <div className="object-info label-box">
        <h3>{ header }</h3>

        <LabelledField label={"Name"} value={this.state.object.name} />
        <LabelledField label={"Description"} value={description} />
        <LabelledField label={"Status"} value={this.state.object.status} hidden={this.state.isContentType} />
        <LabelledField label={"Library ID"} value={this.state.libraryId} />
        <LabelledField label={"Object ID"} value={this.state.objectId} />
        <LabelledField label={"Owner"} value={this.state.object.owner} />
        <LabelledField label={"Type"} value={this.state.object.type} hidden={this.state.isContentType} />
        { this.ContractInfo() }
        <LabelledField label={"Versions"} value={this.state.object.versions.length} />
        <LabelledField label={"Parts"} value={latestVersion.parts.length} />
        <LabelledField label={"Total size"} value={this.VersionSize(latestVersion)} />

        { this.ObjectVersion(this.state.object.versions[0], this.state.object.versions.length, true) }

        { this.PreviousVersions() }
      </div>
    );
  }

  DeleteObjectButton() {
    // Don't allow deleting of library content object
    if(!this.state.isNormalObject) { return null; }
    return (
      <button className="action delete-action" onClick={() => this.DeleteContentObject()}>
        Delete Content Object
      </button>
    );
  }

  PageContent() {
    if(this.state.deleted) {
      return <Redirect push to={Path.join("/content", this.state.libraryId)}/>;
    }

    let appLink;
    if(this.state.object.meta && this.state.object.meta.app) {
      appLink = (
        <Link to={Path.join(this.props.match.url, "app")} className="action">
          View App
        </Link>
      );
    }

    const setContractButton = this.state.isNormalObject ?
      <Link to={Path.join(this.props.match.url, "deploy")} className="action" >Set Custom Contract</Link>
      : null;

    return (
      <div className="page-container content-page-container">
        <div className="actions-container">
          <Link to={Path.dirname(this.props.match.url)} className="action secondary" >Back</Link>
          <Link to={Path.join(this.props.match.url, "edit")} className="action" >Edit Content Object</Link>
          { setContractButton }
          <Link to={Path.join(this.props.match.url, "upload")} className="action" >Upload Parts</Link>
          { this.DeleteObjectButton() }
          { appLink }
        </div>
        <div className="object-display">
          <h3 className="page-header">{ this.state.object.name }</h3>
          { this.ObjectMedia() }
          { this.ObjectInfo() }
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
