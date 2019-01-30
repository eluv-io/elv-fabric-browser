import React from "react";
import Path from "path";

import { LibraryCard } from "../../components/DisplayCards";
import RequestPage from "../RequestPage";

import LibraryIcon from "../../../static/icons/content.svg";
import {PageHeader} from "../../components/Page";
import Action from "../../components/Action";

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
          await this.props.ListContentLibraries();
        }
      })
    });
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
          <Action type="link" to={Path.join(path, "create")}>New Library</Action>
        </div>
        <PageHeader header="Content Libraries" />
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
