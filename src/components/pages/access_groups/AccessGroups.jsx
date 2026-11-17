import React from "react";
import UrlJoin from "url-join";
import AccessGroupIcon from "@/assets/icons/groups.svg";
import {PageHeader} from "../../components/Page";
import Listing from "../../components/Listing";
import {observer} from "mobx-react";
import ActionsToolbar from "../../components/ActionsToolbar";
import {groupStore} from "@/stores/index";

class AccessGroups extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      listingVersion: 0
    };

    this.AccessGroups = this.AccessGroups.bind(this);
  }

  AccessGroups() {
    if(!groupStore.accessGroups) { return []; }

    return Object.values(groupStore.accessGroups).map(accessGroup => {
      return {
        id: accessGroup.address,
        title: accessGroup.name,
        description: accessGroup.description || accessGroup.address,
        status: "",
        icon: AccessGroupIcon,
        link: UrlJoin(this.props.match.url, accessGroup.address)
      };
    });
  }

  AccessGroupsListing() {
    return (
      <Listing
        className="compact"
        pageId="AccessGroups"
        paginate={true}
        count={groupStore.accessGroupsCount}
        LoadContent={
          async ({params}) => {
            await groupStore.ListAccessGroups({params});
            this.setState({listingVersion: this.state.listingVersion + 1});
          }
        }
        RenderContent={this.AccessGroups}
        noIcon={true}
        noStatus={true}
      />
    );
  }

  render() {
    return (
      <div className="page-container contents-page-container">
        <ActionsToolbar
          actions={[
            {
              label: "New Access Group",
              type: "link",
              path: "/access-groups/create"
            }
          ]}
        />
        <PageHeader header="Access Groups" />
        <div className="page-content">
          { this.AccessGroupsListing() }
        </div>
      </div>
    );
  }
}

export default observer(AccessGroups);
