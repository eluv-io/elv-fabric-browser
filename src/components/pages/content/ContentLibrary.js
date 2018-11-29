import React from "react";
import {LibraryCard, ThreeCard} from "../../components/DisplayCards";
import { Link } from "react-router-dom";
import Path from "path";
import ContentIcon from "../../../static/icons/content.svg";
import RequestPage from "../RequestPage";
import { LabelledField } from "../../components/LabelledField";
import Redirect from "react-router/es/Redirect";
import Fabric from "../../../clients/Fabric";
import ClippedText from "../../components/ClippedText";

class ContentLibrary extends React.Component {
  constructor(props) {
    super(props);

    const libraryId = this.props.match.params.libraryId;

    this.state = {
      libraryId,
      metadataVisible: false,
      isContentSpaceLibrary: Fabric.utils.EqualHash(Fabric.contentSpaceId, libraryId)
    };

    this.RequestComplete = this.RequestComplete.bind(this);
  }

  componentDidMount() {
    this.setState({
      requestId: this.props.ListContentObjects({ libraryId: this.state.libraryId })
    });
  }

  RequestComplete() {
    if(this.state.deleting && this.props.requests[this.state.requestId].completed) {
      this.setState({
        deleted: true
      });
    }

    this.setState({
      contentLibrary: this.props.contentLibraries[this.state.libraryId]
    });
  }

  DeleteContentLibrary() {
    if(confirm("Are you sure you want to delete this library?")) {
      this.setState({
        requestId: this.props.DeleteContentLibrary({libraryId: this.state.libraryId}),
        deleting: true
      });
    }
  }

  DeleteContentLibraryButton() {
    // Don't allow deletion of special content space library
    if(this.state.isContentSpaceLibrary) { return null; }

    return (
      <button className="action delete-action" onClick={() => this.DeleteContentLibrary()}>
        Delete Content Library
      </button>
    );
  }

  ContentObjects() {
    if(!this.state.contentLibrary) { return this.state.contentLibrary; }

    let objectElements = [];

    for(const contentObject of this.state.contentLibrary.contentObjects.sort()) {
      let icon = ContentIcon;

      if(contentObject.HasImage()) {
        icon = contentObject.RepUrl("image");
      }

      objectElements.push(
        <LibraryCard
          key={contentObject.objectId}
          libraryId={contentObject.objectId}
          link={Path.join(this.props.match.url, contentObject.objectId)}
          icon={icon}
          name={contentObject.name}
          description={contentObject.metadata && contentObject.metadata.description}
          title={contentObject.name}
        />
      );
    }

    return (
      <div className="object-info label-box">
        <h3>Content</h3>
        {objectElements}
      </div>
    )
  }

  ToggleMetadataButton() {
    const toggleVisible = () => this.setState({metadataVisible: !this.state.metadataVisible});
    const toggleButtonText = (this.state.metadataVisible ? "Hide Metadata" : "Show Metadata");

    return (
      <div className="actions-container">
        <button
          className={"action action-compact action-wide " + (this.state.metadataVisible ? "" : "secondary")}
          onClick={toggleVisible}>
          { toggleButtonText }
        </button>
      </div>
    );
  }

  LibraryMetadata() {
    let content;
    if(this.state.metadataVisible) {
      content = <pre className="content-object-data">{JSON.stringify(this.state.contentLibrary.metadata, null, 2)}</pre>;
    }

    return (
      <div className="formatted-data">
        <LabelledField label="Metadata" value={this.ToggleMetadataButton()} />
        { content }
      </div>
    );
  }

  LibraryInfo() {
    const description = <ClippedText className="object-description" text={this.state.contentLibrary.description} />;

    return (
      <div className="object-info label-box">
        <h3>Content Library Info</h3>
        <LabelledField label={"Library ID"} value={this.state.libraryId} />
        <LabelledField label={"Description"} value={description} />
        <LabelledField label={"Contract Address"} value={this.state.contentLibrary.contractAddress} />
        <LabelledField label={"Content Objects"} value={this.state.contentLibrary.contentObjects.length} />
        { this.LibraryMetadata() }
      </div>
    )
  }

  PageContent() {
    if(!this.state.contentLibrary) { return null; }

    if(this.state.deleted) {
      return <Redirect push to={"/content"}/>;
    }

    return (
      <div className="page-container contents-page-container">
        <div className="actions-container">
          <Link to={Path.dirname(this.props.match.url)} className="action secondary" >Back</Link>
          <Link to={Path.join(this.props.match.url, "edit")} className="action" >Edit Content Library</Link>
          <Link to={Path.join(this.props.match.url, "create")} className="action" >New Content Object</Link>
          { this.DeleteContentLibraryButton() }
        </div>
        <div className="object-display">
          <h3 className="page-header">{ this.state.contentLibrary.name }</h3>
          { this.LibraryInfo() }
          { this.ContentObjects() }
        </div>
      </div>
    );
  }

  render() {
    return (
      <RequestPage
        pageContent={this.PageContent()}
        requestId={this.state.requestId}
        requests={this.props.requests}
        OnRequestComplete={this.RequestComplete}
      />
    );
  }
}

export default ContentLibrary;
