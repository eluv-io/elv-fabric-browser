import React from "react";
import UrlJoin from "url-join";
import TypeIcon from "../../../static/icons/content.svg";
import {PageHeader} from "../../components/Page";
import {Action} from "elv-components-js";
import Listing from "../../components/Listing";
import {inject, observer} from "mobx-react";

@inject("typeStore")
@observer
class ContentTypes extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      listingVersion: 0
    };

    this.ContentTypes = this.ContentTypes.bind(this);
  }

  ContentTypes() {
    if(!this.props.typeStore.types) { return []; }

    const types = Object.keys(this.props.typeStore.types).sort().map(typeId => {
      const type = this.props.typeStore.types[typeId];

      return {
        id: typeId,
        sortKey: type.name || "zz",
        title: type.name || "Content Type " + typeId,
        description: type.description,
        icon: TypeIcon,
        link: UrlJoin("/content-types", typeId)
      };
    });

    return types.sort((a, b) => a.sortKey.toLowerCase() > b.sortKey.toLowerCase() ? 1 : -1);
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
            count={this.props.typeStore.count}
            LoadContent={
              async ({params}) => {
                await this.props.typeStore.ListContentTypes({params});
                this.setState({listingVersion: this.state.listingVersion + 1});
              }
            }
            RenderContent={this.ContentTypes}
          />
        </div>
      </div>
    );
  }
}

export default ContentTypes;
