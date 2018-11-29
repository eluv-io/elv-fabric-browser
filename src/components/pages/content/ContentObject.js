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

    const libraryId = this.props.match.params.libraryId;
    const objectId = this.props.match.params.objectId;

    this.state = {
      libraryId,
      objectId,
      visibleVersions: {},
      appRef: React.createRef(),
      isLibraryObject: Fabric.utils.EqualHash(libraryId, objectId)
    };

    this.RequestComplete = this.RequestComplete.bind(this);
  }

  componentDidMount() {
    let requestId = this.props.GetFullContentObject({
      libraryId: this.state.libraryId,
      objectId: this.state.objectId
    });

    this.setState({
      requestId: requestId
    });
  }

  RequestComplete() {
    if(this.state.deleting && this.props.requests[this.state.requestId].completed) {
      this.setState({
        deleted: true
      });
    } else if(this.state.deletingVersion) {
      // Version deleted - reload object
      this.setState({
        deletingVersion: false,
        requestId: this.props.GetFullContentObject({
          libraryId: this.state.libraryId,
          objectId: this.state.objectId
        })
      });
    }

    const contentObject = this.props.contentObjects[this.state.objectId];

    if(contentObject) {
      this.setState({
        contentObject
      })
    }
  }

  DeleteContentObject() {
    if(confirm("Are you sure you want to delete this content object?")) {
      this.setState({
        requestId: this.props.DeleteContentObject({
          libraryId: this.state.libraryId,
          objectId: this.state.objectId
        }),
        deleting: true
      });
    }
  }

  DeleteContentVersion(versionHash) {
    if(confirm("Are you sure you want to delete this content version?")) {
      this.setState({
        requestId: this.props.DeleteContentVersion({
          libraryId: this.state.libraryId,
          objectId: this.state.objectId,
          versionHash
        }),
        deletingVersion: true
      });
    }
  }

  DeleteObjectButton() {
    // Don't allow deleting of library content object
    if(this.state.isLibraryObject) { return null; }
    return (
      <button className="action delete-action" onClick={() => this.DeleteContentObject()}>
        Delete Content Object
      </button>
    );
  }

  DeleteVersionButton(versionHash) {
    // Don't allow deleting of last version
    if(this.state.contentObject.versions.length === 1) { return null; }

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

  ObjectMedia(contentObject) {
    let image;
    let video;

    if(contentObject.HasImage()) {
      image = (
        <div className="object-image">
          <img src={contentObject.RepUrl("image")} />
        </div>
      );
    }

    if(contentObject.metadata["offering.en"]) {
      video = (
        <div className="object-video">
          <DashVideo videoUrl={contentObject.RepUrl("dash/en.mpd")} />
        </div>
      );
    }

    if(!image && !video) {
      return null;
    } else {
      return (
        <div className="object-media">
          {image}
          {video}
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
      versionHeader = <LabelledField label={<h4>{"Version " + versionNumber}</h4>} value={this.ToggleButton("Version", version.hash)} />;
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
          <LabelledField label={"Total size"} value={version.TotalSize()} />
          { this.FormattedData("Metadata", "metadata-" + versionNumber, version.metadata) }
          { this.FormattedData("Verification", "verification-" + versionNumber, version.verification) }
          { this.ObjectParts(version) }

          <br/>

          { this.DeleteVersionButton(version.hash)}
        </div>
      </div>
    );
  }

  PreviousVersions(contentObject) {
    if(contentObject.versions.length < 2) { return null; }

    return (
      <div>
        <h3>Previous Versions</h3>

        { contentObject.versions.slice(1).map((version, i) => {
          const versionNumber = (i+1 - contentObject.versions.length) * -1;
          return this.ObjectVersion(version, versionNumber);
        })}
      </div>
    );
  }

  ContractInfo(contentObject) {
    let contractInfo = [];
    contractInfo.push(
      <LabelledField
        key={"contract-" + contentObject.contractAddress}
        label={"Contract Address"}
        value={<Link className="inline-link" to={Path.join(this.props.match.url, "contract")}>{contentObject.contractAddress}</Link>} />
    );

    if(contentObject.metadata.customContract) {
      const customContractAddress = contentObject.metadata.customContract.address.toLowerCase();
      contractInfo.push(
        <LabelledField
          key={"contract-" + customContractAddress}
          label={"Custom Contract"}
          value={<Link className="inline-link" to={Path.join(this.props.match.url, "custom-contract")}>{customContractAddress}</Link>} />);
    }

    return contractInfo;
  }

  ObjectInfo(contentObject) {
    const description = <ClippedText className="object-description" text={contentObject.description} />;

    return (
      <div className="object-info label-box">
        <h3>Content Object Info</h3>

        <LabelledField label={"Library ID"} value={contentObject.libraryId} />
        <LabelledField label={"Object ID"} value={contentObject.objectId} />
        <LabelledField label={"Name"} value={contentObject.name} />
        <LabelledField label={"Type"} value={contentObject.type} />
        <LabelledField label={"Description"} value={description} />
        { this.ContractInfo(contentObject) }
        <LabelledField label={"Versions"} value={contentObject.versions.length} />
        <LabelledField label={"Parts"} value={contentObject.parts.length} />
        <LabelledField label={"Total size"} value={contentObject.TotalSize()} />

        { this.FormattedData("Raw Data", "rawData", contentObject.rawData) /* TODO: Remove for production */ }

        { this.ObjectVersion(contentObject.versions[0], contentObject.versions.length, true) }

        { this.PreviousVersions(contentObject) }
      </div>
    );
  }

  ContentObject() {
    if(!this.state.contentObject) { return null; }

    if(this.state.deleted) {
      return <Redirect push to={Path.join("/content", this.state.libraryId)}/>;
    }

    let appLink;
    if(this.state.contentObject.metadata && this.state.contentObject.metadata.app) {
      appLink = (
        <Link to={Path.join(this.props.match.url, "app")} className="action">
          View App
        </Link>
      );
    }

    return (
      <div className="page-container content-page-container">
        <div className="actions-container">
          <Link to={Path.dirname(this.props.match.url)} className="action secondary" >Back</Link>
          <Link to={Path.join(this.props.match.url, "edit")} className="action" >Edit Content Object</Link>
          <Link to={Path.join(this.props.match.url, "deploy")} className="action" >Set Custom Contract</Link>
          <Link to={Path.join(this.props.match.url, "upload")} className="action" >Upload Parts</Link>
          { this.DeleteObjectButton() }
          { appLink }
        </div>
        <div className="object-display">
          <h3 className="page-header">{ this.state.contentObject.name }</h3>
          { this.ObjectMedia(this.state.contentObject) }
          { this.ObjectInfo(this.state.contentObject) }
        </div>
      </div>
    );
  }

  render() {
    return (
      <RequestPage
        pageContent={this.ContentObject()}
        requestId={this.state.requestId}
        requests={this.props.requests}
        OnRequestComplete={this.RequestComplete}
      />
    );
  }
}

export default ContentObject;
