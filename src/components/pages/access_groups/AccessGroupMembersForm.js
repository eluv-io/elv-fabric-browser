import React from "react";
import PropTypes from "prop-types";
import Path from "path";
import Id from "../../../utils/Id";
import { FormatAddress } from "../../../utils/Helpers";
import Action from "../../components/Action";
import Form from "../../forms/Form";

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
        <div className="actions-container compact">
          <Action className="action-compact action-wide delete-action" onClick={this.RemoveMember(memberId)}>
            Remove Member
          </Action>
        </div>
      );

      // Disallow non-owners from modifying managers
      const disabled = !this.props.accessGroup.isOwner && member.manager;

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
            <input disabled={!this.props.accessGroup.isOwner} name="manager" type="checkbox" value={member.manager} checked={member.manager} onChange={this.HandleInputChange(memberId)} />
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
          <label className="label" htmlFor="addMember" />
          <div className="actions-container left">
            <Action type="button" className="action-compact action-full-width" onClick={this.AddMember}>Add Member</Action>
          </div>
        </div>

        { this.Members() }
      </div>
    );
  }

  render() {
    return (
      <Form
        legend={"Manage Access Group Members"}
        formContent={this.MembersForm()}
        redirectPath={Path.dirname(this.props.match.url)}
        cancelPath={Path.dirname(this.props.match.url)}
        status={this.props.methodStatus.Submit}
        OnSubmit={this.HandleSubmit}
      />
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
