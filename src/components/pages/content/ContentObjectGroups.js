import React from "react";
import UrlJoin from "url-join";
import {Tabs} from "elv-components-js";
import Listing from "../../components/Listing";
import {inject, observer} from "mobx-react";

import PropTypes from "prop-types";

@inject("objectStore")
@observer
class ContentObjectGroups extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      view: "access",
      groups: []
    };

    this.FilterGroups = this.FilterGroups.bind(this);
  }

  FilterGroups(filterOptions) {
    const page = filterOptions.params.page;
    const perPage = filterOptions.params.perPage;

    let groups = Object
      .values(this.props.groupPermissions)
      .filter(group => group.permissions.includes(this.state.view))
      .sort((a, b) => (a.name || "zz").toLowerCase() > (b.name || "zz").toLowerCase() ? 1 : -1)
      .slice((page - 1) * perPage, page * perPage);

    if(filterOptions.params.filter) {
      groups = groups.filter(group => group.name.toLowerCase()
        .includes(filterOptions.params.filter.toLowerCase()));
    }

    this.setState({
      groups
    });
  }

  AccessGroups() {
    const groupsInfo = this.state.groups.map(group => {
      return {
        id: group.address,
        sortKey: (group.name || "zz").toLowerCase(),
        title: group.name || group.address,
        description: group.description,
        link: UrlJoin("/access-groups", group.address)
      };
    });

    return groupsInfo.sort((a, b) => a.sortKey.toLowerCase() > b.sortKey.toLowerCase() ? 1 : -1);
  }

  render() {
    let groupCount = Object
      .values(this.props.groupPermissions)
      .filter(group => group.permissions.includes(this.state.view))
      .length;

    return (
      <div>
        <Tabs
          options={[
            ["See", "see"],
            ["Access", "access"],
            ["Manage", "manage"]
          ]}
          className="secondary"
          selected={this.state.view}
          onChange={(value) => this.setState({view: value})}
        />
        <Listing
          key={`object-access-group-listing-${this.state.view}`}
          className="compact"
          pageId="ObjectAccessGroups"
          noIcon={true}
          noStatus={true}
          paginate={true}
          count={groupCount}
          LoadContent={this.FilterGroups}
          RenderContent={(filterOptions) => this.AccessGroups(filterOptions)}
        />
      </div>
    );
  }
}

ContentObjectGroups.propTypes = {
  groupPermissions: PropTypes.object.isRequired
};

export default ContentObjectGroups;
