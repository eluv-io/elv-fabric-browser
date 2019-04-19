import React from "react";
import PropTypes from "prop-types";
import { Link } from "react-router-dom";
import UrlJoin from "url-join";
import Path from "path";
import {LabelledField} from "../../components/LabelledField";
import ClippedText from "../../components/ClippedText";
import Redirect from "react-router/es/Redirect";
import {PageHeader} from "../../components/Page";
import {Action, LoadingElement} from "elv-components-js";
import Listing from "../../components/Listing";

class AccessGroup extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      visibleElements: {}
    };

    this.PageContent = this.PageContent.bind(this);
    this.DeleteAccessGroup = this.DeleteAccessGroup.bind(this);
    this.AccessGroupMembers = this.AccessGroupMembers.bind(this);
  }

  async DeleteAccessGroup() {
    if (confirm("Are you sure you want to delete this access group?")) {
      await this.props.methods.RemoveAccessGroup({address: this.props.contractAddress});
    }
  }

  AccessGroupMembers() {
    if(!this.props.accessGroup.members) { return []; }

    const members = Object.values(this.props.accessGroup.members).map(member => {
      const type = member.manager ? "Manager" : "Member";
      return {
        id: member.address,
        sortKey: member.name || "zz",
        key: `${type}-${member.address}`,
        title: member.name,
        description: member.address,
        status: type,
        link: "/"
      };
    });

    return members.sort((a, b) => a.sortKey > b.sortKey ? 1 : -1);
  }

  AccessGroupMembersListing() {
    return (
      <Listing
        pageId="AccessGroupMembers"
        paginate={true}
        count={this.props.membersCount}
        loadingStatus={this.props.methodStatus.ListAccessGroupMembers}
        LoadContent={({params}) =>
          this.props.methods.ListAccessGroupMembers({contractAddress: this.props.contractAddress, params})}
        RenderContent={this.AccessGroupMembers}
        noIcon={true}
      />
    );
  }

  Actions() {
    let editButton;
    let deleteButton;
    if(this.props.accessGroup.isOwner) {
      editButton = <Action type="link" to={UrlJoin(this.props.match.url, "edit")}>Manage</Action>;
      deleteButton = <Action className="delete-action" onClick={this.DeleteAccessGroup}>Delete</Action>;
    }

    let manageButton;
    if(this.props.accessGroup.isOwner || this.props.accessGroup.isManager) {
      manageButton = <Action type="link" to={UrlJoin(this.props.match.url, "members")}>Members</Action>;
    }

    return (
      <div className="actions-container">
        <Action type="link" to={Path.dirname(this.props.match.url)} className="secondary" >Back</Action>
        { editButton }
        { manageButton }
        { deleteButton }
      </div>
    );
  }

  PageContent() {
    if(this.props.methodStatus.RemoveAccessGroup.completed) {
      return <Redirect push to={Path.dirname(this.props.match.url)}/>;
    }

    const description = <ClippedText className="object-description" text={this.props.accessGroup.description} />;

    return (
      <div className="page-container access-group-page-container">
        { this.Actions() }
        <PageHeader header={this.props.accessGroup.name} />
        <div className="page-content">
          <div className="label-box">
            <LabelledField label="Description" value={description} />
            <LabelledField label="Owner" value={this.props.accessGroup.owner} />
            <LabelledField label="Contract Address" value={
              <Link className="inline-link" to={UrlJoin(this.props.match.url, "contract")}>
                { this.props.accessGroup.address }
              </Link>
            } />
            <h3>Members</h3>
            { this.AccessGroupMembersListing() }
          </div>
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
