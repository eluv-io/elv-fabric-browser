import React from "react";
import PropTypes from "prop-types";
import Path from "path";
import Id from "../../../utils/Id";
import { FormatAddress } from "../../../utils/Helpers";
import {Action, Form} from "elv-components-js";

class AccessGroupMembersForm extends React.Component {
  constructor(props) {
    super(props);

    let members = {};
    Object.values(props.accessGroup.members).map(member => {
      members[Id.next()] = {
        name: member.name,
        address: member.address,
        manager: member.manager
      };
    });

    this.state = {
      members,
      originalMembers: props.accessGroup.members
    };

    this.HandleInputChange = this.HandleInputChange.bind(this);
    this.HandleSubmit = this.HandleSubmit.bind(this);
    this.AddMember = this.AddMember.bind(this);
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
    };
  }

  async HandleSubmit() {
    let members = {};
    Object.values(this.state.members).map(member => {
      members[member.name] = {
        name: member.name,
        address: FormatAddress(member.address),
        manager: member.manager
      };
    });

    await this.props.methods.Submit({
      address: this.props.contractAddress,
      members: members,
      originalMembers: this.state.originalMembers
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
    });
  }

  RemoveMember(memberId) {
    return () => {
      let members = this.state.members;
      delete members[memberId];

      this.setState({
        members
      });
    };
  }

  Members() {
    return Object.keys(this.state.members).map(memberId => {
      const member = this.state.members[memberId];
      const removeMemberButton = (
        <Action className="delete-action" onClick={this.RemoveMember(memberId)}>
          Remove Member
        </Action>
      );

      // Disallow non-owners from modifying managers
      const disabled = !this.props.accessGroup.isOwner && member.manager;

      return (
        <div key={"member-" + memberId} className="form-content">
          <label htmlFor="name" >Name</label>
          <input disabled={disabled} name="name" value={member.name} onChange={this.HandleInputChange(memberId)} />

          <label htmlFor="address">Address</label>
          <input disabled={disabled} name="address" value={member.address} onChange={this.HandleInputChange(memberId)} />

          <label htmlFor="manager">Manager</label>
          <input disabled={!this.props.accessGroup.isOwner} name="manager" type="checkbox" value={member.manager} checked={member.manager} onChange={this.HandleInputChange(memberId)} />

          <label htmlFor="removeMember" />
          { removeMemberButton }
        </div>
      );
    });
  }

  MembersForm() {
    return (
      <div className="form">
        <div className="form-content">
          <label htmlFor="addMember" />
          <Action type="button" onClick={this.AddMember}>Add Member</Action>
        </div>
        { this.Members() }
      </div>
    );
  }

  render() {
    return (
      <div>
        <div className="actions-container manage-actions">
          <Action type="link" to={Path.dirname(this.props.match.url)} className="secondary">Back</Action>
        </div>
        <Form
          legend={"Manage Access Group Members"}
          formContent={this.MembersForm()}
          redirectPath={Path.dirname(this.props.match.url)}
          cancelPath={Path.dirname(this.props.match.url)}
          status={this.props.methodStatus.Submit}
          OnSubmit={this.HandleSubmit}
        />
      </div>
    );
  }
}

AccessGroupMembersForm.propTypes = {
  accessGroup: PropTypes.object.isRequired,
  contractAddress: PropTypes.string.isRequired,
  createForm: PropTypes.bool.isRequired,
  methods: PropTypes.shape({
    Submit: PropTypes.func.isRequired
  })
};

export default AccessGroupMembersForm;
