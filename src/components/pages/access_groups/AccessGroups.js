import React from "react";
import UrlJoin from "url-join";
import AccessGroupIcon from "../../../static/icons/groups.svg";
import {PageHeader} from "../../components/Page";
import {Action} from "elv-components-js";
import Listing from "../../components/Listing";
import {inject, observer} from "mobx-react";
import ContentLookup from "../../components/ContentLookup";

@inject("groupStore")
@observer
class AccessGroups extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      listingVersion: 0
    };

    this.AccessGroups = this.AccessGroups.bind(this);
  }

  AccessGroups() {
    if(!this.props.groupStore.accessGroups) { return []; }

    return Object.values(this.props.groupStore.accessGroups).map(accessGroup => {
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
        count={this.props.groupStore.accessGroupsCount}
        LoadContent={
          async ({params}) => {
            await this.props.groupStore.ListAccessGroups({params});
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
        <div className="actions-container content-lookup-actions-container">
          <Action type="link" to="/access-groups/create">New Access Group</Action>
          <ContentLookup />
        </div>
        <PageHeader header="Access Groups" />
        <div className="page-content">
          { this.AccessGroupsListing() }
        </div>
      </div>
    );
  }
}

export default AccessGroups;
