import React from "react";
import {Link} from "react-router-dom";
import Path from "path";
import RequestPage from "../RequestPage";
import PrettyBytes from "pretty-bytes";
import { LabelledField } from "../../components/LabelledField";
import DashVideo from "../DashVideo";

class ContentObject extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      libraryId: this.props.match.params.libraryId,
      objectId: this.props.match.params.objectId,
      visibleVersions: {},
      appRef: React.createRef()
    };
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
                contentHash: version.hash,
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
          <br />
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

  ObjectInfo(contentObject) {
    return (
      <div className="object-info label-box">
        <h3>Content Object Info</h3>

        <LabelledField label={"Library ID"} value={contentObject.libraryId} />
        <LabelledField label={"Object ID"} value={contentObject.objectId} />
        <LabelledField label={"Name"} value={contentObject.name} />
        <LabelledField label={"Type"} value={contentObject.type} />
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
    let contentObject = this.props.contentObjects[this.state.objectId];

    if(!contentObject) { return null; }

    let appLink;
    if(contentObject.metadata && contentObject.metadata.app) {
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
          <Link to={Path.join(this.props.match.url, "edit")} className="action" >Edit Metadata</Link>
          <Link to={Path.join(this.props.match.url, "upload")} className="action" >Upload Parts</Link>
          { appLink }
        </div>
        <div className="object-display">
          <h3 className="page-header">{ contentObject.name }</h3>
          { this.ObjectMedia(contentObject) }
          { this.ObjectInfo(contentObject) }
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
      />
    );
  }
}

export default ContentObject;
