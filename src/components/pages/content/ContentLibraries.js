import React from "react";
import { Link } from "react-router-dom";
import Path from "path";

import { LibraryCard } from "../../components/DisplayCards";
import RequestPage from "../RequestPage";

import LibraryIcon from "../../../static/images/logo-coin.png";

class ContentLibraries extends React.Component {
  constructor(props) {
    super(props);
    this.state = {};
  }

  componentDidMount() {
    this.setState({
      requestId: this.props.ListContentLibraries()
    });
  }

  LibraryPreviewImages(contentLibrary) {
    let previews = [];

    for(const contentObject of contentLibrary.contentObjects) {
      const imageUrl = contentObject.Image();
      if(imageUrl) {
        previews.push({
          name: contentObject.name,
          image: imageUrl
        });
      }
    }

    return previews;
  }

  ContentLibraries(path) {
    let libraryElements = [];

    for(const libraryId of Object.keys(this.props.contentLibraries)) {
      let contentLibrary = this.props.contentLibraries[libraryId];
      libraryElements.push(
        <LibraryCard
          key={libraryId}
          libraryId={libraryId}
          link={Path.join(path, libraryId)}
          icon={LibraryIcon}
          previews={this.LibraryPreviewImages(contentLibrary)}
          name={contentLibrary.name}
          infoText={contentLibrary.contentObjects.length + " Content Objects"}
          description={contentLibrary.description}
        />
      );
    }

    return libraryElements;
  }

  PageContent() {
    // This is the root component, actual path may be "/content" or "/"
    let path = "/content";
    return (
      <div className="page-container contents-page-container">
        <div className="actions-container">
          <Link to={Path.join(path, "create")} className="action" >New Library</Link>
        </div>
        { this.ContentLibraries(path) }
      </div>
    );
  }

  render() {
    return (
      <RequestPage
        pageContent={this.PageContent()}
        requestId={this.state.requestId}
        requests={this.props.requests}
      />
    );
  }
}

export default ContentLibraries;
