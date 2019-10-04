import React from "react";
import UrlJoin from "url-join";
import AccessGroupIcon from "../../../static/icons/groups.svg";
import {PageHeader} from "../../components/Page";
import {Action} from "elv-components-js";
import Listing from "../../components/Listing";
import {inject, observer} from "mobx-react";

@inject("groupStore")
@observer
class AccessGroups extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      version: 0
    };

    this.AccessGroups = this.AccessGroups.bind(this);
  }

  AccessGroups() {
    if(!this.props.groupStore.accessGroups) { return []; }

    return Object.values(this.props.groupStore.accessGroups).map(accessGroup => {
      return {
        id: accessGroup.address,
        title: accessGroup.name,
        description: accessGroup.address,
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
            this.setState({version: this.state.version + 1});
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
        <div className="actions-container">
          <Action type="link" to="/access-groups/create">New Access Group</Action>
        </div>
        <PageHeader header="Access Groups" />
        { this.AccessGroupsListing() }
      </div>
    );
  }
}

export default AccessGroups;
