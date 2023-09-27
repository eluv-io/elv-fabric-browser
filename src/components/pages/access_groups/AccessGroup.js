import React from "react";
import { Link } from "react-router-dom";
import UrlJoin from "url-join";
import Path from "path";
import {LabelledField} from "../../components/LabelledField";
import ClippedText from "../../components/ClippedText";
import {Redirect} from "react-router";
import {PageHeader} from "../../components/Page";
import {Confirm, IconButton, Tabs} from "elv-components-js";
import Listing from "../../components/Listing";
import RemoveIcon from "../../../static/icons/close.svg";
import {inject, observer} from "mobx-react";
import AsyncComponent from "elv-components-js/src/components/AsyncComponent";
import JSONField from "../../components/JSONField";
import ToggleSection from "../../components/ToggleSection";
import ContentObjectGroups from "../content/ContentObjectGroups";
import ActionsToolbar from "../../components/ActionsToolbar";

@inject("groupStore")
@observer
class AccessGroup extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      visibleElements: {},
      view: "members",
      listingVersion: 0
    };

    this.PageContent = this.PageContent.bind(this);
    this.DeleteAccessGroup = this.DeleteAccessGroup.bind(this);
    this.AccessGroupMembers = this.AccessGroupMembers.bind(this);
    this.RemoveAccessGroupMember = this.RemoveAccessGroupMember.bind(this);
    this.LeaveAccessGroup = this.LeaveAccessGroup.bind(this);
  }

  async DeleteAccessGroup() {
    await Confirm({
      message: "Are you sure you want to delete this access group?",
      onConfirm: async () => {
        await this.props.groupStore.RemoveAccessGroup({
          address: this.props.groupStore.contractAddress
        });

        this.setState({redirect: true});
      }
    });
  }

  async RemoveAccessGroupMember(memberAddress) {
    const manager = this.state.view === "managers";

    await Confirm({
      message: `Are you sure you want to remove this ${manager ? "manager" : "member"} from the group?`,
      onConfirm: async () => await this.props.groupStore.RemoveAccessGroupMember({
        contractAddress: this.props.groupStore.contractAddress,
        memberAddress,
        manager
      })
    });

    if(this.state.listingRef) {
      this.state.listingRef.Load();
    }
  }

  async LeaveAccessGroup() {
    await Confirm({
      message: "Are you sure you want to leave this group?",
      onConfirm: async () => {
        await this.props.groupStore.LeaveAccessGroup({
          contractAddress: this.props.groupStore.contractAddress
        });

        this.setState({redirect: true});
      }
    });
  }

  AccessGroupMembers() {
    const members = this.state.view === "managers" ?
      this.props.groupStore.accessGroup.managers :
      this.props.groupStore.accessGroup.members;

    if(!members) { return []; }

    const memberInfo = Object.values(members).map(member => {
      const canRemove = (
        this.props.groupStore.accessGroup.isManager ||
        this.props.groupStore.accessGroup.isOwner
      );

      return {
        id: member.address,
        sortKey: member.name || "zz",
        key: `${this.state.view}-${member.address}`,
        title: member.name,
        description: member.address,
        descriptionCopyable: true,
        status: (
          <div className="listing-action-icon">
            <IconButton
              icon={RemoveIcon}
              label={`Remove ${this.state.view === "managers" ? "Manager" : "Member"}`}
              onClick={async () => await this.RemoveAccessGroupMember(member.address)}
              hidden={!canRemove}
            >
              Remove
            </IconButton>
          </div>
        )
      };
    });

    return memberInfo.sort((a, b) => a.sortKey.toLowerCase() > b.sortKey.toLowerCase() ? 1 : -1);
  }

  AccessGroupMembersListing() {
    const count = this.state.view === "managers" ?
      this.props.groupStore.accessGroup.managersCount :
      this.props.groupStore.accessGroup.membersCount;

    return (
      <Listing
        ref={ref => {
          if(!this.state.listingRef) {
            this.setState({listingRef: ref});
          }
        }}
        key={`${this.state.view}-listing`}
        className="compact"
        pageId="AccessGroupMembers"
        paginate={true}
        count={count}
        LoadContent={async ({params}) => {
          await this.props.groupStore.ListAccessGroupMembers({
            contractAddress: this.props.groupStore.contractAddress,
            showManagers: this.state.view === "managers",
            params
          });

          this.setState({listingVersion: this.state.listingVersion + 1});
        }}
        RenderContent={this.AccessGroupMembers}
        noIcon={true}
        noLink={true}
      />
    );
  }

  Actions() {
    return (
      <ActionsToolbar
        actions={[
          {
            label: "Back",
            type: "link",
            path: Path.dirname(this.props.match.url),
            className: "secondary"
          },
          {
            label: "Manage",
            type: "link",
            hidden: !this.props.groupStore.accessGroup.isOwner,
            path: UrlJoin(this.props.match.url, "edit"),
          },
          {
            label: "Add Member",
            type: "link",
            hidden: !this.props.groupStore.accessGroup.isManager,
            path: UrlJoin(this.props.match.url, "add-member")
          },
          {
            label: "Leave Group",
            type: "button",
            hidden: this.props.groupStore.accessGroup.isOwner,
            onClick: () => this.LeaveAccessGroup(),
            className: "danger"
          },
          {
            label: "Delete",
            type: "button",
            hidden: (true || !this.props.groupStore.accessGroup.isOwner),
            onClick: () => this.DeleteAccessGroup(),
            className: "danger"
          }
        ]}
      />
    );
  }

  PageContent() {
    if(this.state.redirect) {
      return <Redirect push to={Path.dirname(this.props.match.url)}/>;
    }

    const group = this.props.groupStore.accessGroup;

    const ownerText = group.ownerName ?
      <span>{group.ownerName}<span className="help-text">({group.owner})</span></span> :
      group.owner;

    const description = <ClippedText className="object-description" text={group.description} />;

    let oauthIssuer, oauthGroups, metadata;
    if(group.oauthInfo) {
      oauthIssuer = (
        <LabelledField label="OAuth Issuer">
          { group.oauthInfo.issuer }
        </LabelledField>
      );

      if(group.oauthInfo.claims && group.oauthInfo.claims.groups) {
        oauthGroups = (
          <LabelledField label="OAuth Groups">
            { Array.isArray(group.oauthInfo.claims.groups) ? group.oauthInfo.claims.groups.join(", ") : group.oauthInfo.claims.groups }
          </LabelledField>
        );
      }
    }

    if(group.isOwner) {
      metadata = (
        <ToggleSection label="Metadata">
          <div className="indented">
            <JSONField json={group.metadata} />
          </div>
        </ToggleSection>
      );
    }

    let pageContent;
    if(this.state.view === "groups") {
      pageContent = (
        <ContentObjectGroups
          currentPage="accessGroup"
          showGroupPermissionsButton={this.props.groupStore.accessGroup.isManager}
          LoadGroupPermissions={() => this.props.groupStore.AccessGroupGroupPermissions({contractAddress: this.props.groupStore.contractAddress})}
        />
      );
    } else {
      pageContent = this.AccessGroupMembersListing();
    }

    return (
      <div className="page-container access-group-page-container">
        { this.Actions() }
        <PageHeader header={group.name} />
        <div className="page-content-container">
          <div className="page-content">
            <div className="label-box">
              <LabelledField label="Description">
                { description }
              </LabelledField>

              <LabelledField label="Owner">
                { ownerText }
              </LabelledField>

              <LabelledField label="Contract Address">
                <Link className="inline-link" to={UrlJoin(this.props.match.url, "contract")}>
                  { group.address }
                </Link>
              </LabelledField>

              { oauthIssuer }
              { oauthGroups }
              { metadata }
            </div>
            <Tabs
              options={[
                ["Members", "members"],
                ["Managers", "managers"],
                ["Groups", "groups"]
              ]}
              selected={this.state.view}
              onChange={(value) => this.setState({view: value})}
            />
            { pageContent }
          </div>
        </div>
      </div>
    );
  }

  render() {
    return (
      <AsyncComponent
        Load={
          async () => this.props.groupStore.AccessGroup({
            contractAddress: this.props.groupStore.contractAddress
          })
        }
        render={this.PageContent}
      />
    );
  }
}

export default AccessGroup;
