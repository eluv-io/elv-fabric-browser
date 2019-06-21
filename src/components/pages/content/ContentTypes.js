import React from "react";
import PropTypes from "prop-types";
import UrlJoin from "url-join";
import TypeIcon from "../../../static/icons/content.svg";
import {PageHeader} from "../../components/Page";
import {Action} from "elv-components-js";
import Listing from "../../components/Listing";

class ContentTypes extends React.Component {
  constructor(props) {
    super(props);
    this.state = {};

    this.ContentTypes = this.ContentTypes.bind(this);
  }

  ContentTypes() {
    if(!this.props.types) { return []; }

    const types = Object.keys(this.props.types).sort().map(typeId => {
      const type = this.props.types[typeId];

      return {
        id: typeId,
        sortKey: type.name || "zz",
        title: type.name || "Content Type " + typeId,
        description: type.description,
        icon: TypeIcon,
        link: UrlJoin("/content-types", typeId)
      };
    });

    return types.sort((a, b) => a.sortKey > b.sortKey ? 1 : -1);
  }

  render() {
    return (
      <div className="page-container contents-page-container">
        <div className="actions-container">
          <Action type="link" to={UrlJoin("/content-types", "create")}>New Content Type</Action>
        </div>
        <PageHeader header="Content Types" />
        <div className="page-content">
          <Listing
            pageId="ContentTypes"
            paginate={true}
            count={this.props.count}
            loadingStatus={this.props.methodStatus.ListContentTypes}
            LoadContent={({params}) => this.props.methods.ListContentTypes({params})}
            RenderContent={this.ContentTypes}
          />
        </div>
      </div>
    );
  }
}

ContentTypes.propTypes = {
  types: PropTypes.object.isRequired,
  count: PropTypes.number.isRequired,
  methods: PropTypes.shape({
    ListContentTypes: PropTypes.func.isRequired
  })
};

export default ContentTypes;
