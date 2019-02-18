import React from "react";
import PropTypes from "prop-types";
import Path from "path";
import Id from "../../../utils/Id";
import Action from "../../components/Action";
import Form from "../../forms/Form";

class ContentLibraryGroupsForm extends React.Component {
  constructor(props) {
    super(props);

    // Attach IDs to each existing group
    // Form:
    //  {
    //    accessors: { 1: {...groupInfo}, 2: {...groupInfo}, ...},
    //    ...
    /// }
    let libraryGroups = {};
    Object.keys(props.library.groups).map(groupType => {
      let libraryGroup = {};
      Object.values(props.library.groups[groupType]).forEach(group => {
        const groupExists = Object.values(this.props.accessGroups)
          .some(existingGroup => group.address === existingGroup.address);

        libraryGroup[Id.next()] = {
          ...group,
          addressSelection: groupExists ? group.address : "",
          hideAddress: groupExists
        };
      });

      libraryGroups[groupType] = libraryGroup;
    });

    this.state = {
      groups: libraryGroups,
      originalGroups: props.library.groups
    };

    this.HandleInputChange = this.HandleInputChange.bind(this);
    this.HandleSubmit = this.HandleSubmit.bind(this);
    this.AddGroup = this.AddGroup.bind(this);
  }

  HandleInputChange(groupType, groupId) {
    return (event) => {
      // Disable address field modification if a group is selected
      const isGroupSelection = !!event.target.selectedOptions;
      const hideAddress = isGroupSelection ? event.target.selectedOptions[0].value !== "" : this.state.groups[groupType][groupId].addressDisabled;

      const value = event.target.type === "checkbox" ? event.target.checked : event.target.value;
      this.setState({
        groups: {
          ...this.state.groups,
          [groupType]: {
            ...this.state.groups[groupType],
            [groupId]: {
              ...this.state.groups[groupType][groupId],
              [event.target.name]: value,
              hideAddress
            }
          }
        }
      });
    };
  }

  async HandleSubmit() {
    let libraryGroups = {};
    Object.keys(this.state.groups).map(groupType => {
      libraryGroups[groupType] = Object.values(this.state.groups[groupType]).map(groupInfo => {
        // Address is either selected address or inputted address
        groupInfo.address = groupInfo.addressSelection || groupInfo.address;
        delete groupInfo.addressSelection;

        return groupInfo;
      });
    });

    await this.props.methods.Submit({
      libraryId: this.props.libraryId,
      groups: libraryGroups,
      originalGroups: this.state.originalGroups
    });
  }

  AddGroup(groupType) {
    const initialAddress = Object.values(this.props.accessGroups).length > 0 ?
      Object.values(this.props.accessGroups)[0].address : "";
    return () => {
      this.setState({
        groups: {
          ...this.state.groups,
          [groupType]: {
            ...this.state.groups[groupType],
            [Id.next()]: {
              address: initialAddress,
              hideAddress: !!initialAddress
            }
          }
        }
      });
    };
  }

  RemoveGroup(groupType, groupId) {
    return () => {
      let groups = this.state.groups;
      delete groups[groupType][groupId];

      this.setState({
        groups
      });
    };
  }

  GroupSelection(groupType, groupId) {
    let options = (
      Object.values(this.props.accessGroups).map(accessGroup => {
        return (
          <option
            key={"option-" + accessGroup.address + "-" + groupId}
            value={accessGroup.address}
          >
            { accessGroup.name }
          </option>
        );
      })
    );
    options.push(<option key={"option-other-" + groupId} value="">[Other]</option>);

    return (
      <select
        name="addressSelection"
        value={this.state.groups[groupType][groupId].addressSelection}
        onChange={this.HandleInputChange(groupType, groupId)}
      >
        { options }
      </select>
    );
  }

  Groups(groupType) {
    return Object.keys(this.state.groups[groupType]).map(groupId => {
      const group = this.state.groups[groupType][groupId];

      return (
        <div key={"group-" + groupId}>
          <div className="labelled-input">
            <label className="label" htmlFor="accessGroup"></label>
            { this.GroupSelection(groupType, groupId) }
          </div>
          <div className={"labelled-input" + (group.hideAddress ? " hidden" : "")}>
            <label className="label" htmlFor="address">Address</label>
            <input name="address" value={group.address} onChange={this.HandleInputChange(groupType, groupId)} />
          </div>
          <div className="labelled-input">
            <label className="label" htmlFor="removeGroup" />
            <div className="actions-container compact">
              <Action className="action-compact action-wide delete-action" onClick={this.RemoveGroup(groupType, groupId)}>
                Remove Group
              </Action>
            </div>
          </div>
        </div>
      );
    });
  }

  GroupsForm(groupType) {
    return (
      <div className="library-group-form-data">
        <div className="labelled-input">
          <label className="label bold" htmlFor="addGroup" >{groupType.capitalize() + "s"}</label>
          <div className="actions-container left">
            <Action className="action-compact action-full-width" onClick={this.AddGroup(groupType)}>
              { `Add ${groupType.capitalize()} Group` }
            </Action>
          </div>
        </div>

        { this.Groups(groupType) }
      </div>
    );
  }

  FormContent() {
    return (
      <div className="library-group-form">
        { this.GroupsForm("accessor") }
        { this.GroupsForm("contributor") }
        { this.GroupsForm("reviewer") }
      </div>
    );
  }

  render() {
    return (
      <Form
        legend={"Manage Library Groups"}
        formContent={this.FormContent()}
        redirectPath={Path.dirname(this.props.match.url)}
        cancelPath={Path.dirname(this.props.match.url)}
        OnSubmit={this.HandleSubmit}
        submitting={this.props.methodStatus.Submit.loading}
        redirect={this.props.methodStatus.Submit.completed}
      />
    );
  }
}

ContentLibraryGroupsForm.propTypes = {
  libraryId: PropTypes.string.isRequired,
  library: PropTypes.object.isRequired,
  accessGroups: PropTypes.object.isRequired,
  methods: PropTypes.shape({
    Submit: PropTypes.func.isRequired
  })
};

export default ContentLibraryGroupsForm;
