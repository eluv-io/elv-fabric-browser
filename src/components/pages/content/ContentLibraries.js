import React from "react";
import UrlJoin from "url-join";
import LibraryIcon from "../../../static/icons/content.svg";
import {PageHeader} from "../../components/Page";
import Listing from "../../components/Listing";
import {inject, observer} from "mobx-react";
import ActionsToolbar from "../../components/ActionsToolbar";

@inject("libraryStore")
@observer
class ContentLibraries extends React.Component {
  constructor(props) {
    super(props);

    this.ContentLibraries = this.ContentLibraries.bind(this);
  }

  ContentLibraries() {
    if(!this.props.libraryStore.libraries) { return []; }

    const libraries = Object.keys(this.props.libraryStore.libraries).sort().map(libraryId => {
      const library = this.props.libraryStore.libraries[libraryId];

      return {
        id: libraryId,
        sortKey: library.name || "zz",
        title: library.name || "Content Library " + libraryId,
        description: library.description,
        icon: library.imageUrl || LibraryIcon,
        link: UrlJoin("/content", libraryId)
      };
    });

    return libraries.sort((a, b) => a.sortKey.toLowerCase() > b.sortKey.toLowerCase() ? 1 : -1);
  }

  render() {
    // This is the root component, actual path may be "/content" or "/"
    return (
      <div className="page-container contents-page-container">
        <ActionsToolbar
          actions={[
            {
              label: "New Library",
              type: "link",
              path: UrlJoin("/content", "create")
            }
          ]}
        />
        <PageHeader header="Content Libraries" />
        <div className="page-content-container">
          <div className="page-content">
            <Listing
              pageId="ContentLibraries"
              paginate={true}
              count={this.props.libraryStore.count}
              LoadContent={this.props.libraryStore.ListContentLibraries}
              RenderContent={this.ContentLibraries}
            />
          </div>
        </div>
      </div>
    );
  }
}

export default ContentLibraries;
