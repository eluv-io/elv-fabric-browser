import React from "react";
import Path from "path";
import LibraryIcon from "../../../static/icons/content.svg";
import {PageHeader} from "../../components/Page";
import Action from "../../components/Action";
import {ListingContainer} from "../../../containers/pages/Components";

class ContentLibraries extends React.Component {
  constructor(props) {
    super(props);
    this.state = {};

    this.LoadLibraries = this.LoadLibraries.bind(this);
    this.ContentLibraries = this.ContentLibraries.bind(this);
  }

  async LoadLibraries() {
    await this.props.ListContentLibraries();
  }

  ContentLibraries() {
    let libraries = [];

    for(let libraryId of Object.keys(this.props.libraries).sort()) {
      const library = this.props.libraries[libraryId];

      libraries.push({
        id: libraryId,
        title: library.name || "Content Library " + libraryId,
        description: library.description,
        status: library.objects.length + " Content Objects",
        icon: library.imageUrl || LibraryIcon,
        link: Path.join("/content", libraryId)
      });
    }

    return libraries;
  }

  render() {
    // This is the root component, actual path may be "/content" or "/"
    return (
      <div className="page-container contents-page-container">
        <div className="actions-container">
          <Action type="link" to={Path.join("/content", "create")}>New Library</Action>
        </div>
        <PageHeader header="Content Libraries" />
        <div className="page-content">
          <ListingContainer
            pageId="ContentLibraries"
            LoadContent={this.LoadLibraries}
            RenderContent={this.ContentLibraries}
          />
        </div>
      </div>
    );
  }
}

export default ContentLibraries;
