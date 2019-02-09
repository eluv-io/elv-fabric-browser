import React from "react";
import Path from "path";
import AccessGroupIcon from "../../../static/icons/groups.svg";
import {PageHeader} from "../../components/Page";
import Action from "../../components/Action";
import {ListingContainer} from "../../../containers/pages/Components";

class AccessGroups extends React.Component {
  constructor(props) {
    super(props);
    this.state = {};

    this.AccessGroups = this.AccessGroups.bind(this);
    this.LoadAccessGroups = this.LoadAccessGroups.bind(this);
  }

  async LoadAccessGroups() {
    await this.props.ListAccessGroups();
  }

  AccessGroups() {
    return Object.values(this.props.accessGroups).map(accessGroup => {
      let members = Object.keys(accessGroup.members).length;
      members = members === 1 ? members + " member" : members + " members";

      return {
        id: accessGroup.address,
        title: accessGroup.name,
        description: accessGroup.description,
        status: members,
        icon: AccessGroupIcon,
        link: Path.join(this.props.match.url, accessGroup.address)
      };
    });
  }

  AccessGroupsListing() {
    return (
      <ListingContainer
        pageId="AccessGroups"
        LoadContent={this.LoadAccessGroups}
        RenderContent={this.AccessGroups}
        noIcon={true}
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
