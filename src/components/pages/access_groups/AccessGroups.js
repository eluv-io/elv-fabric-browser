import React from "react";
import PropTypes from "prop-types";
import Path from "path";
import AccessGroupIcon from "../../../static/icons/groups.svg";
import {PageHeader} from "../../components/Page";
import Action from "../../components/Action";
import Listing from "../../components/Listing";

class AccessGroups extends React.Component {
  constructor(props) {
    super(props);
    this.state = {};

    this.AccessGroups = this.AccessGroups.bind(this);
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
      <Listing
        pageId="AccessGroups"
        paginate={true}
        count={this.props.count}
        loadingStatus={this.props.methodStatus.ListAccessGroups}
        LoadContent={({params}) => this.props.methods.ListAccessGroups(params)}
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

AccessGroups.propTypes = {
  accessGroups: PropTypes.object.isRequired,
  count: PropTypes.number.isRequired,
  methods: PropTypes.shape({
    ListAccessGroups: PropTypes.func.isRequired
  })
};


export default AccessGroups;
