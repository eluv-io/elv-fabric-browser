import React from "react";
import UrlJoin from "url-join";
import {Action, AsyncComponent, Tabs} from "elv-components-js";
import Listing from "../../components/Listing";
import {inject, observer} from "mobx-react";

import ContentObjectGroupForm from "./ContentObjectGroupForm";

@inject("objectStore")
@observer
class ContentObjectGroups extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      view: "access",
      groups: [],
      showGroupForm: false,
      pageVersion: 0
    };

    this.FilterGroups = this.FilterGroups.bind(this);
  }

  FilterGroups(filterOptions) {
    const page = filterOptions.params.page;
    const perPage = filterOptions.params.perPage;

    let groups = Object
      .values(this.props.objectStore.objectGroupPermissions)
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
    const GroupCount = () => {
      return Object
        .values(this.props.objectStore.objectGroupPermissions)
        .filter(group => group.permissions.includes(this.state.view))
        .length;
    };

    let groupsButton;
    if(this.props.objectStore.object.isOwner || (this.props.objectStore.object.isNormalObject && this.props.objectStore.object.permission !== "owner" && this.props.objectStore.object.canEdit)) {
      groupsButton = (
        <Action onClick={() => this.setState({showGroupForm: true})}>
          Manage Group Permissions
        </Action>
      );
    }

    return (
      <AsyncComponent
        Load={
          async () => {
            await this.props.objectStore.ContentObjectGroupPermissions({objectId: this.props.objectStore.objectId});
          }
        }
        render={() => (
          <div>
            { groupsButton }
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
            <AsyncComponent
              Load={
                async () => {
                  await this.props.objectStore.ContentObjectGroupPermissions({objectId: this.props.objectStore.objectId});
                }
              }
              render={() => (
                <Listing
                  key={`object-access-group-listing-${this.state.view}-${this.state.pageVersion}`}
                  className="compact"
                  pageId="ObjectAccessGroups"
                  noIcon={true}
                  noStatus={true}
                  paginate={true}
                  count={GroupCount()}
                  LoadContent={this.FilterGroups}
                  RenderContent={(filterOptions) => this.AccessGroups(filterOptions)}
                />
              )}
            />
            {
              this.state.showGroupForm ?
                <ContentObjectGroupForm CloseModal={() => this.setState({showGroupForm: false, pageVersion: this.state.pageVersion + 1})}/> : null
            }
          </div>
        )}
      />
    );
  }
}

export default ContentObjectGroups;
