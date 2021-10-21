import React from "react";
import UrlJoin from "url-join";
import {Action, AsyncComponent, Tabs} from "elv-components-js";
import Listing from "../../components/Listing";
import {inject, observer} from "mobx-react";
import PropTypes from "prop-types";

import ContentObjectGroupForm from "./ContentObjectGroupForm";

@inject("objectStore")
@inject("groupStore")
@observer
class ContentObjectGroups extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      view: "access",
      showGroupForm: false,
      filterOptions: {
        params: {
          page: 1,
          perPage: 10,
          filter: ""
        }
      },
      pageVersion: 0
    };
  }

  FilterGroups(filterOptions) {
    const page = filterOptions.params.page;
    const perPage = filterOptions.params.perPage;

    let groups = Object
      .values(this.props.currentPage === "contentObject" ? (this.props.objectStore.objectGroupPermissions || {}) : this.props.groupStore.accessGroup.groupPermissions || {})
      .filter(group => group.permissions.includes(this.state.view))
      .sort((a, b) => (a.name || "zz").toLowerCase() > (b.name || "zz").toLowerCase() ? 1 : -1)
      .slice((page - 1) * perPage, page * perPage);

    if(filterOptions.params.filter) {
      groups = groups.filter(group => group.name.toLowerCase()
        .includes(filterOptions.params.filter.toLowerCase()));
    }

    return groups;
  }

  AccessGroups() {
    const groupsInfo = this.FilterGroups(this.state.filterOptions).map(group => {
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
    const GroupCount = () => {
      return Object
        .values(this.props.currentPage === "contentObject" ? (this.props.objectStore.objectGroupPermissions || {}) : this.props.groupStore.accessGroup.groupPermissions || {})
        .filter(group => group.permissions.includes(this.state.view))
        .length;
    };

    let groupPermissionsButton;
    if(this.props.showGroupPermissionsButton) {
      groupPermissionsButton = (
        <div>
          <Action onClick={() => this.setState({showGroupForm: true})}>
            Manage Group Permissions
          </Action>
        </div>
      );
    }

    return (
      <AsyncComponent
        Load={async () => {
          await this.props.groupStore.ListAccessGroups({params: {}});
          await this.props.LoadGroupPermissions();
        }}
        render={() => (
          <React.Fragment>
            { groupPermissionsButton }
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
              key={`object-access-group-listing-${this.state.view}-${this.state.pageVersion}`}
              className="compact"
              pageId="ObjectAccessGroups"
              noIcon={true}
              noStatus={true}
              paginate={true}
              count={GroupCount()}
              LoadContent={(filterOptions => this.setState(filterOptions))}
              RenderContent={() => this.AccessGroups()}
            />
            {
              this.state.showGroupForm ?
                <ContentObjectGroupForm
                  LoadGroupPermissions={this.props.LoadGroupPermissions}
                  currentPage={this.props.currentPage}
                  CloseModal={() => this.setState({showGroupForm: false, pageVersion: this.state.pageVersion + 1})}/> :
                null
            }
          </React.Fragment>
        )}
      />
    );
  }
}

ContentObjectGroups.propTypes = {
  currentPage: PropTypes.string.isRequired
};

export default ContentObjectGroups;
