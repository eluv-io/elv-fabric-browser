import React from "react";
import {Action, AsyncComponent, Confirm, IconButton, Tabs} from "elv-components-js";
import Listing from "../../components/Listing";
import {inject, observer} from "mobx-react";
import PropTypes from "prop-types";

import ContentObjectGroupForm from "./ContentObjectGroupForm";
import RemoveIcon from "../../../static/icons/close.svg";

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
      pageVersion: 0,
      loaded: false
    };
  }

  FilterGroups(filterOptions) {
    const page = filterOptions.params.page;
    const perPage = filterOptions.params.perPage;

    const groupsObject = (this.props.currentPage === "contentObject" ? (this.props.objectStore.objectGroupPermissions || {}) : this.props.groupStore.accessGroup.groupPermissions || {});
    let groups = Object
      .values(groupsObject)
      .filter(group => group.permissions.includes(this.state.view))
      .sort((a, b) => (a.name || "zz").toLowerCase() > (b.name || "zz").toLowerCase() ? 1 : -1)
      .slice((page - 1) * perPage, page * perPage);

    if(filterOptions.params.filter) {
      groups = groups.filter(group => group.name.toLowerCase()
        .includes(filterOptions.params.filter.toLowerCase()));
    }

    return groups;
  }

  async RemoveAccessGroupPermission({groupAddress}) {
    let itemText;
    if(this.props.currentPage === "accessGroup") {
      itemText = "group";
    } else if(this.props.objectStore.object.isContentType) {
      itemText = "content type";
    } else {
      itemText = "object";
    }

    await Confirm({
      message: `Are you sure you want to remove this group's permissions on this ${itemText}?`,
      onConfirm: async () => {
        await this.props.objectStore.RemoveContentObjectGroupPermission({
          objectId: this.props.objectStore.objectId,
          groupAddress,
          permission: this.state.view
        });
      }
    });

    if(this.state.listingRef) {
      this.state.listingRef.Load();
    }

    this.setState({pageVersion: this.state.pageVersion + 1});
  }

  AccessGroups() {
    const editCondition = this.props.currentPage === "contentObject" ? this.props.objectStore.object.canEdit : this.props.groupStore.accessGroup.isManager;
    const groupsInfo = this.FilterGroups(this.state.filterOptions).map(group => {
      return {
        id: group.address,
        sortKey: (group.name || "zz").toLowerCase(),
        title: group.name || group.address,
        description: group.description,
        status: editCondition ? (
          <div className="listing-action-icon">
            <IconButton
              icon={RemoveIcon}
              label="Remove Access Group"
              onClick={async () => {
                await this.RemoveAccessGroupPermission({groupAddress: group.address});
                this.props.RefreshCallback();
              }}
            >
              Remove
            </IconButton>
          </div>
        ) : ""
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

    const options = [
      ["View", "access"],
      ["Manage", "manage"]
    ];

    if(this.props.currentPage !== "accessGroup") {
      options.unshift(
        ["See", "see"]
      );
    }

    return (
      <AsyncComponent
        Load={async () => {
          if(this.props.currentPage !== "accessGroup") {
            await this.props.groupStore.ListAccessGroups({
              params: {},
              publicOnly: true
            });
          }
        }}
        render={() => (
          <React.Fragment>
            {
              this.state.loaded &&
                <>
                  { groupPermissionsButton }
                  <Tabs
                    options={options}
                    className="secondary"
                    selected={this.state.view}
                    onChange={(value) => this.setState({view: value})}
                  />
                </>
            }
            <Listing
              ref={ref => {
                if(!this.state.listingRef) {
                  this.setState({listingRef: ref});
                }
              }}
              key={`object-access-group-listing-${this.state.view}-${this.state.pageVersion}`}
              className="compact"
              pageId="ObjectAccessGroups"
              noIcon={true}
              noLink={true}
              paginate={true}
              count={GroupCount()}
              LoadContent={async (filterOptions) => {
                await this.props.LoadGroupPermissions();
                this.setState({filterOptions, loaded: true});
              }}
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
