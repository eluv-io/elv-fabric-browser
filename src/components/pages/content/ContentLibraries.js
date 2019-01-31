import React from "react";
import Path from "path";
import RequestPage from "../RequestPage";

import LibraryIcon from "../../../static/icons/content.svg";
import {PageHeader} from "../../components/Page";
import Action from "../../components/Action";
import Listing from "../../components/Listing";

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

    return <Listing pageId="ContentLibraries" content={libraries} /> ;
  }

  PageContent() {
    // This is the root component, actual path may be "/content" or "/"
    return (
      <div className="page-container contents-page-container">
        <div className="actions-container">
          <Action type="link" to={Path.join("/content", "create")}>New Library</Action>
        </div>
        <PageHeader header="Content Libraries" />
        { this.ContentLibraries() }
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
