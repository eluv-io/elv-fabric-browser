import React from "react";
import PropTypes from "prop-types";
import UrlJoin from "url-join";
import LibraryIcon from "../../../static/icons/content.svg";
import {PageHeader} from "../../components/Page";
import {Action} from "elv-components-js";
import Listing from "../../components/Listing";

class ContentLibraries extends React.Component {
  constructor(props) {
    super(props);
    this.state = {};

    this.ContentLibraries = this.ContentLibraries.bind(this);
  }

  ContentLibraries() {
    if(!this.props.libraries) { return []; }

    const libraries = Object.keys(this.props.libraries).sort().map(libraryId => {
      const library = this.props.libraries[libraryId];

      return {
        id: libraryId,
        sortKey: library.name || "zz",
        title: library.name || "Content Library " + libraryId,
        description: library.description,
        status: library.objects.length + " Content Objects",
        icon: library.imageUrl || LibraryIcon,
        link: UrlJoin("/content", libraryId)
      };
    });

    return libraries.sort((a, b) => a.sortKey > b.sortKey ? 1 : -1);
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
            count={this.props.count.libraries}
            selectFilterLabel="Library Types"
            selectFilterOptions={[
              ["Content", "content"],
              ["All", "all"],
              ["Eluvio Media Platform", "elv-media-platform"]
            ]}
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
