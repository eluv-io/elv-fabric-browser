import React from "react";
import UrlJoin from "url-join";
import TypeIcon from "@/assets/icons/content.svg";
import {PageHeader} from "../../components/Page";
import Listing from "../../components/Listing";
import {observer} from "mobx-react";
import ActionsToolbar from "../../components/ActionsToolbar";

import {typeStore} from "@/stores/index";

class ContentTypes extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      listingVersion: 0
    };

    this.ContentTypes = this.ContentTypes.bind(this);
  }

  ContentTypes() {
    if(!typeStore.types) { return []; }

    const types = Object.keys(typeStore.types).sort().map(typeId => {
      const type = typeStore.types[typeId];

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
        <ActionsToolbar
          actions={[
            {
              label: "New Content Type",
              type: "link",
              path: UrlJoin("/content-types", "create")
            }
          ]}
        />
        <PageHeader header="Content Types" />
        <div className="page-content-container">
          <div className="page-content">
            <Listing
              pageId="ContentTypes"
              paginate={true}
              count={typeStore.count}
              LoadContent={
                async ({params}) => {
                  await typeStore.ListContentTypes({params});
                  this.setState({listingVersion: this.state.listingVersion + 1});
                }
              }
              RenderContent={this.ContentTypes}
            />
          </div>
        </div>
      </div>
    );
  }
}

export default observer(ContentTypes);
