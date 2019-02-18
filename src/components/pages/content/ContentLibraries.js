import React from "react";
import PropTypes from "prop-types";
import Path from "path";
import LibraryIcon from "../../../static/icons/content.svg";
import {PageHeader} from "../../components/Page";
import Action from "../../components/Action";
import Listing from "../../components/Listing";

class ContentLibraries extends React.Component {
  constructor(props) {
    super(props);
    this.state = {};

    this.ContentLibraries = this.ContentLibraries.bind(this);
  }

  ContentLibraries() {
    let libraries = [];

    for(let libraryId of Object.keys(this.props.libraries).sort()) {
      const library = this.props.libraries[libraryId];

      libraries.push({
        id: libraryId,
        sortKey: library.name || "zz",
        title: library.name || "Content Library " + libraryId,
        description: library.description,
        status: library.objects.length + " Content Objects",
        icon: library.imageUrl || LibraryIcon,
        link: Path.join("/content", libraryId)
      });
    }

    return libraries.sort((a, b) => a.sortKey > b.sortKey ? 1 : -1);
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
          <Listing
            pageId="ContentLibraries"
            paginate={true}
            count={this.props.count.libraries}
            loadingStatus={this.props.methodStatus.ListContentLibraries}
            LoadContent={({params}) => this.props.methods.ListContentLibraries({params})}
            RenderContent={this.ContentLibraries}
          />
        </div>
      </div>
    );
  }
}

ContentLibraries.propTypes = {
  libraries: PropTypes.object.isRequired,
  count: PropTypes.object.isRequired,
  methods: PropTypes.shape({
    ListContentLibraries: PropTypes.func.isRequired
  })
};

export default ContentLibraries;
