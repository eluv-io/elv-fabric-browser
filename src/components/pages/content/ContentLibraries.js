import React from "react";
import { Link } from "react-router-dom";
import Path from "path";

import { LibraryCard } from "../../components/DisplayCards";
import RequestPage from "../RequestPage";

import LibraryIcon from "../../../static/icons/content.svg";

class ContentLibraries extends React.Component {
  constructor(props) {
    super(props);
    this.state = {};

    this.PageContent = this.PageContent.bind(this);
  }

  componentDidMount() {
    this.setState({
      requestId: this.props.WrapRequest({
        todo: async () => {
          await this.props.SetCurrentAccount();
          await this.props.ListContentLibraries();
          await Promise.all(
            Object.keys(this.props.libraries).map(async libraryId => {
              await this.props.ListContentObjects({libraryId});
            })
          );
        }
      })
    });
  }

  LibraryPreviewImages(library) {
    let previews = [];

    for(const objectId of library.objects) {
      const object = this.props.objects[objectId];
      if(object.imageUrl) {
        previews.push({
          name: object.name,
          image: object.imageUrl
        });
      }
    }

    return previews;
  }

  ContentLibraries(path) {
    let libraryElements = [];

    for(const libraryId of Object.keys(this.props.libraries).sort()) {
      const library = this.props.libraries[libraryId];

      libraryElements.push(
        <LibraryCard
          key={libraryId}
          libraryId={libraryId}
          link={Path.join(path, libraryId)}
          icon={library.imageUrl || LibraryIcon}
          previews={this.LibraryPreviewImages(library)}
          name={library.name}
          isOwner={library.isOwner}
          infoText={library.objects.length + " Content Objects"}
          description={library.description}
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
        <h3 className="page-header">Content Libraries</h3>
        { this.ContentLibraries(path) }
      </div>
    );
  }

  render() {
    return (
      <RequestPage
        pageContent={this.PageContent}
        requestId={this.state.requestId}
        requests={this.props.requests}
      />
    );
  }
}

export default ContentLibraries;
