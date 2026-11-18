import React from "react";
import UrlJoin from "url-join";
//import Listing from "@/components/Listing";
import ActionsToolbar from "@/components/ActionsToolbar";
import {libraryStore} from "@/stores";
import {observer} from "mobx-react";

import LibraryIcon from "@/assets/icons/content.svg";
import {Button, CopyableField, CopyButton, IconButton, PageHeader} from "@/components/Components";

class ContentLibraries extends React.Component {
  constructor(props) {
    super(props);

    this.ContentLibraries = this.ContentLibraries.bind(this);
  }

  ContentLibraries() {
    if(!libraryStore.libraries) { return []; }

    const libraries = Object.keys(libraryStore.libraries).sort().map(libraryId => {
      const library = libraryStore.libraries[libraryId];

      return {
        id: libraryId,
        sortKey: library.name || "zz",
        title: library.name || "Content Library " + libraryId,
        subtitle: library.name ? libraryId : undefined,
        description: library.description,
        icon: LibraryIcon,
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
            {
              /*

              <Listing
                pageId="ContentLibraries"
                paginate={true}
                count={libraryStore.count}
                LoadContent={libraryStore.ListContentLibraries}
                RenderContent={this.ContentLibraries}
              />

               */
            }
          </div>
        </div>
      </div>
    );
  }
}

export default observer(ContentLibraries);
