import React from "react";
import UrlJoin from "url-join";
import LibraryIcon from "../../../static/icons/content.svg";
import {PageHeader} from "../../components/Page";
import {Action} from "elv-components-js";
import Listing from "../../components/Listing";
import {inject, observer} from "mobx-react";

@inject("libraryStore")
@observer
class ContentLibraries extends React.Component {
  constructor(props) {
    super(props);
    this.state = {};

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
        <div className="actions-container">
          <Action type="link" to={UrlJoin("/content", "create")}>New Library</Action>
        </div>
        <PageHeader header="Content Libraries" />
        <div className="page-content">
          <Listing
            pageId="ContentLibraries"
            paginate={true}
            count={this.props.libraryStore.count}
            selectFilterLabel="Library Types"
            selectFilterOptions={[
              ["Content", "content"],
              ["All", "all"],
              ["Eluvio Media Platform", "elv-media-platform"]
            ]}
            LoadContent={this.props.libraryStore.ListContentLibraries}
            RenderContent={this.ContentLibraries}
          />
        </div>
      </div>
    );
  }
}

export default ContentLibraries;
