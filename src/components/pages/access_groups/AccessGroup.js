import React from "react";
import PropTypes from "prop-types";
import { Link } from "react-router-dom";
import UrlJoin from "url-join";
import Path from "path";
import {LabelledField} from "../../components/LabelledField";
import ClippedText from "../../components/ClippedText";
import Redirect from "react-router/es/Redirect";
import {PageHeader} from "../../components/Page";
import {Action, Confirm, IconButton, LoadingElement, Tabs} from "elv-components-js";
import Listing from "../../components/Listing";
import RemoveIcon from "../../../static/icons/close.svg";

class AccessGroup extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      visibleElements: {},
      view: "members"
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
      onConfirm: async () => await this.props.methods.RemoveAccessGroup({address: this.props.contractAddress})
    });
  }

  async RemoveAccessGroupMember(memberAddress) {
    const manager = this.state.view === "managers";

    await Confirm({
      message: `Are you sure you want to remove this ${manager ? "manager" : "member"} from the group?`,
      onConfirm: async () => await this.props.methods.RemoveAccessGroupMember({
        contractAddress: this.props.contractAddress,
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
      onConfirm: async () => await this.props.methods.LeaveAccessGroup({
        contractAddress: this.props.contractAddress
      })
    });
  }

  AccessGroupMembers() {
    if(!this.props.accessGroupMembers) { return []; }

    const members = Object.values(this.props.accessGroupMembers).map(member => {
      const canRemove = (
        this.props.accessGroup.isManager ||
        this.props.accessGroup.isOwner
      );

      return {
        id: member.address,
        sortKey: member.name || "zz",
        key: `${this.state.view}-${member.address}`,
        title: member.name,
        description: member.address,
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

    return members.sort((a, b) => a.sortKey > b.sortKey ? 1 : -1);
  }

  AccessGroupMembersListing() {
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
        count={this.props.accessGroupMembersCount}
        loadingStatus={this.props.methodStatus.ListAccessGroupMembers}
        LoadContent={({params}) => {
          this.props.methods.ListAccessGroupMembers({
            contractAddress: this.props.contractAddress,
            showManagers: this.state.view === "managers",
            params
          });
        }}
        RenderContent={this.AccessGroupMembers}
        noIcon={true}
      />
    );
  }

  Actions() {
    return (
      <div className="actions-container">
        <Action type="link" to={Path.dirname(this.props.match.url)} className="secondary" >Back</Action>
        <Action type="link" to={UrlJoin(this.props.match.url, "edit")} hidden={!this.props.accessGroup.isOwner}>Manage</Action>
        <Action type="link" to={UrlJoin(this.props.match.url, "add-member")} hidden={!this.props.accessGroup.isManager}>Add Member</Action>
        <Action className="danger" onClick={this.LeaveAccessGroup} hidden={this.props.accessGroup.isOwner}>Leave Group</Action>
        <Action className="danger" onClick={this.DeleteAccessGroup} hidden={true}>Delete</Action>
      </div>
    );
  }

  PageContent() {
    if(
      this.props.methodStatus.RemoveAccessGroup.completed ||
      this.props.methodStatus.LeaveAccessGroup.completed
    ) {
      return <Redirect push to={Path.dirname(this.props.match.url)}/>;
    }

    const ownerText = this.props.accessGroup.ownerName ?
      <span>{this.props.accessGroup.ownerName}<span className="help-text">({this.props.accessGroup.owner})</span></span> :
      this.props.accessGroup.owner;

    const description = <ClippedText className="object-description" text={this.props.accessGroup.description} />;

    return (
      <div className="page-container access-group-page-container">
        { this.Actions() }
        <PageHeader header={this.props.accessGroup.name} />
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
                { this.props.accessGroup.address }
              </Link>
            </LabelledField>
          </div>
          <Tabs
            options={[
              ["Members", "members"],
              ["Managers", "managers"]
            ]}
            selected={this.state.view}
            onChange={(value) => this.setState({view: value})}
          />
          { this.AccessGroupMembersListing() }
        </div>
      </div>
    );
  }

  render() {
    return (
      <LoadingElement
        fullPage={true}
        loading={this.props.methodStatus.RemoveAccessGroup.loading}
        render={this.PageContent}
      />
    );
  }
}

AccessGroup.propTypes = {
  accessGroup: PropTypes.object.isRequired,
  contractAddress: PropTypes.string.isRequired,
  membersCount: PropTypes.number,
  methods: PropTypes.shape({
    RemoveAccessGroup: PropTypes.func.isRequired
  })
};

export default AccessGroup;
