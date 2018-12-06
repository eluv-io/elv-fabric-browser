import React from "react";
import RequestForm from "../../forms/RequestForm";
import RequestPage from "../RequestPage";
import Path from "path";
import Id from "../../../utils/Id";
import Fabric from "../../../clients/Fabric";

class AccessGroupMembersForm extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      name: "",
      description: "",
      submitRequestId: undefined,
      loadRequestId: undefined,
      accessGroupName: this.props.match.params.accessGroupName
    };

    this.RequestComplete = this.RequestComplete.bind(this);
    this.HandleInputChange = this.HandleInputChange.bind(this);
    this.HandleSubmit = this.HandleSubmit.bind(this);
    this.AddMember = this.AddMember.bind(this);
  }

  componentDidMount() {
    this.setState({
      loadRequestId: this.props.ListAccessGroups()
    })
  }

  RequestComplete() {
    const accessGroup = this.props.accessGroups[this.state.accessGroupName];

    let members = {};
    Object.values(accessGroup.members).map(member => {
      members[Id.next()] = {
        name: member.name,
        address: member.address,
        manager: member.manager
      };
    });

    this.setState({
      accessGroup,
      isOwner: this.props.currentAccountAddress.toLowerCase() === accessGroup.owner.toLowerCase(),
      name: accessGroup.name,
      description: accessGroup.description,
      address: accessGroup.address,
      members,
      originalMembers: accessGroup.members
    });
  }

  HandleInputChange(memberId) {
    return (event) => {
      const value = event.target.type === "checkbox" ? event.target.checked : event.target.value;
      this.setState({
        members: {
          ...this.state.members,
          [memberId]: {
            ...this.state.members[memberId],
            [event.target.name]: value
          }
        }
      });
    }
  }

  HandleSubmit() {
    let members = {};
    Object.values(this.state.members).map(member => {
      members[member.name] = {
        name: member.name,
        address: Fabric.FormatAddress(member.address),
        manager: member.manager
      }
    });

    this.setState({
      submitRequestId: this.props.UpdateAccessGroupMembers({
        name: this.state.name,
        members: members,
        originalMembers: this.state.originalMembers
      })
    });
  }

  AddMember() {
    this.setState({
      members: {
        ...this.state.members,
        [Id.next()]: {
          name: "",
          address: "",
          manager: false
        }
      }
    })
  }

  RemoveMember(memberId) {
    return () => {
      let members = this.state.members;
      delete members[memberId];

      this.setState({
        members
      })
    }
  }

  Members() {
    return Object.keys(this.state.members).map(memberId => {
      const member = this.state.members[memberId];
      const removeMemberButton = (
        <div className="actions-container compact">
          <button className="action action-compact action-wide delete-action" type="button" onClick={this.RemoveMember(memberId)}>
            Remove Member
          </button>
        </div>
      );

      // Disallow non-owners from modifying managers
      const disabled = !this.state.isOwner && member.manager;

      return (
        <div key={"member-" + memberId}>
          <div className="labelled-input">
            <label className="label" htmlFor="name" >Name</label>
            <input disabled={disabled} name="name" value={member.name} onChange={this.HandleInputChange(memberId)} />
          </div>
          <div className="labelled-input">
            <label className="label" htmlFor="address">Address</label>
            <input disabled={disabled} name="address" value={member.address} onChange={this.HandleInputChange(memberId)} />
          </div>
          <div className="labelled-input labelled-checkbox-input">
            <label className="label" htmlFor="manager">Manager</label>
            <input disabled={!this.state.isOwner} name="manager" type="checkbox" value={member.manager} checked={member.manager} onChange={this.HandleInputChange(memberId)} />
          </div>
          <div className="labelled-input">
            <label className="label" htmlFor="removeMember"></label>
            { removeMemberButton }
          </div>
        </div>
      );
    });
  }

  MembersForm() {
    return (
      <div className="access-group-form-data">
        <div className="labelled-input">
          <label className="label" htmlFor="addMember" ></label>
          <div className="actions-container left">
            <button className="action action-compact action-full-width" type="button" onClick={this.AddMember}>Add Member</button>
          </div>
        </div>

        { this.Members() }
      </div>
    );
  }

  PageContent() {
    if(!this.state.accessGroup) { return null; }

    return (
      <RequestForm
        requests={this.props.requests}
        requestId={this.state.submitRequestId}
        legend={"Manage Access Group Members"}
        formContent={this.MembersForm()}
        redirectPath={Path.dirname(this.props.match.url)}
        cancelPath={Path.dirname(this.props.match.url)}
        OnSubmit={this.HandleSubmit}
      />
    );
  }

  render() {
    if (this.state.createForm) {
      return this.PageContent();
    } else {
      return (
        <RequestPage
          requests={this.props.requests}
          requestId={this.state.loadRequestId}
          pageContent={this.PageContent()}
          OnRequestComplete={this.RequestComplete}
        />
      )
    }
  }
}

export default AccessGroupMembersForm;
