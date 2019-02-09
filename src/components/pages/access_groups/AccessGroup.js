import React from "react";
import { Link } from "react-router-dom";
import Path from "path";

import RequestPage from "../RequestPage";
import {LabelledField} from "../../components/LabelledField";
import ClippedText from "../../components/ClippedText";
import Redirect from "react-router/es/Redirect";
import {EqualAddress} from "../../../utils/Helpers";
import {PageHeader} from "../../components/Page";
import Action from "../../components/Action";
import {ListingContainer} from "../../../containers/pages/Components";

class AccessGroup extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      contractAddress: this.props.match.params.contractAddress,
      visibleElements: {}
    };

    this.PageContent = this.PageContent.bind(this);
    this.RequestComplete = this.RequestComplete.bind(this);
    this.DeleteAccessGroup = this.DeleteAccessGroup.bind(this);
    this.LoadAccessGroupMembers = this.LoadAccessGroupMembers.bind(this);
    this.AccessGroupMembers = this.AccessGroupMembers.bind(this);
  }

  componentDidMount() {
    this.setState({
      requestId: this.props.WrapRequest({
        todo: async () => {
          await this.LoadAccessGroupMembers();
        }
      })
    });
  }

  async LoadAccessGroupMembers() {
    await this.props.SetCurrentAccount();
    await this.props.ListAccessGroups();
  }

  RequestComplete() {
    if(this.state.deleting && this.props.requests[this.state.requestId].completed) {
      this.setState({
        deleted: true
      });
    } else {
      this.setState({
        accessGroup: this.props.accessGroups[this.state.contractAddress]
      });
    }
  }

  DeleteAccessGroup() {
    if (confirm("Are you sure you want to delete this access group?")) {
      const deleteRequestId = this.props.WrapRequest({
        todo: async () => {
          await this.props.RemoveAccessGroup({address: this.state.contractAddress});
        }
      });

      this.setState({
        requestId: deleteRequestId,
        deleting: true
      });
    }
  }

  AccessGroupMembers() {
    return Object.values(this.state.accessGroup.members).map(member => {
      return {
        id: member.address,
        title: member.name,
        description: member.address,
        status: member.manager ? "Manager" : "Member",
        link: "/"
      };
    });
  }

  AccessGroupMembersListing() {
    return (
      <ListingContainer
        pageId="AccessGroupMembers"
        LoadContent={this.LoadAccessGroupMembers}
        RenderContent={this.AccessGroupMembers}
        noIcon={true}
      />
    );
  }

  Actions() {
    const isManager = Object.values(this.state.accessGroup.members)
      .some(member => EqualAddress(member.address, this.props.currentAccountAddress) && member.manager);

    let editButton;
    let deleteButton;
    if(this.state.accessGroup.isOwner) {
      editButton = <Action type="link" to={Path.join(this.props.match.url, "edit")}>Manage Group</Action>;
      deleteButton = <Action className="delete-action" onClick={this.DeleteAccessGroup}>Delete</Action>;
    }

    let manageButton;
    if(isManager || this.state.accessGroup.isOwner) {
      manageButton = <Action type="link" to={Path.join(this.props.match.url, "members")}>Manage Members</Action>;
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
    if(this.state.deleted) {
      return <Redirect push to={Path.dirname(this.props.match.url)}/>;
    }

    const description = <ClippedText className="object-description" text={this.state.accessGroup.description} />;

    return (
      <div className="page-container access-group-page-container">
        { this.Actions() }
        <PageHeader header={this.state.accessGroup.name} />
        <div className="page-content">
          <div className="label-box">
            <LabelledField label="Description" value={description} />
            <LabelledField label="Owner" value={this.state.accessGroup.owner} />
            <LabelledField label="Contract Address" value={
              <Link className="inline-link" to={Path.join(this.props.match.url, "contract")}>
                { this.state.accessGroup.address }
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
      <RequestPage
        pageContent={this.PageContent}
        requestId={this.state.requestId}
        requests={this.props.requests}
        OnRequestComplete={this.RequestComplete}
      />
    );
  }
}

export default AccessGroup;
