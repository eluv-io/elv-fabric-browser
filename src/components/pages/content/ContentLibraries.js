import React from "react";
import UrlJoin from "url-join";
import LibraryIcon from "../../../static/icons/content.svg";
import {PageHeader} from "../../components/Page";
import {Action, onEnterPressed} from "elv-components-js";
import Listing from "../../components/Listing";
import {inject, observer} from "mobx-react";
import {Redirect} from "react-router";

@inject("libraryStore")
@observer
class ContentLibraries extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      contentLookupId: "",
      lookupRedirect: ""
    };

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

  ContentLookup() {
    const Lookup = async () => {
      const redirectPath =
        await this.props.libraryStore.LookupContent(this.state.contentLookupId);

      if(!redirectPath) { return; }

      this.setState({lookupRedirect: redirectPath});
    };

    return (
      <div className="content-lookup-container">
        <input
          value={this.state.contentLookupId}
          onChange={event => this.setState({contentLookupId: event.target.value})}
          onKeyPress={onEnterPressed(Lookup)}
          placeholder="Find content by ID, version hash or address"
        />
        <Action onClick={Lookup}>
          Search
        </Action>
      </div>
    );
  }

  render() {
    if(this.state.lookupRedirect) {
      return <Redirect to={this.state.lookupRedirect} />;
    }

    // This is the root component, actual path may be "/content" or "/"
    return (
      <div className="page-container contents-page-container">
        <div className="actions-container content-lookup-actions-container">
          <Action type="link" to={UrlJoin("/content", "create")}>New Library</Action>
          { this.ContentLookup() }
        </div>
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
