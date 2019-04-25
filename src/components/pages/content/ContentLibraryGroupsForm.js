import React from "react";
import PropTypes from "prop-types";
import Path from "path";
import Id from "../../../utils/Id";
import {Action, Form} from "elv-components-js";

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
          groupSelection: groupExists ? group.address : "",
          knownGroup: groupExists
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
      const knownGroup = isGroupSelection ? event.target.selectedOptions[0].value !== "" : this.state.groups[groupType][groupId].addressDisabled;

      const value = event.target.type === "checkbox" ? event.target.checked : event.target.value;
      this.setState({
        groups: {
          ...this.state.groups,
          [groupType]: {
            ...this.state.groups[groupType],
            [groupId]: {
              ...this.state.groups[groupType][groupId],
              address: isGroupSelection ? value : this.state.groups[groupType][groupId],
              [event.target.name]: value,
              knownGroup
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
        groupInfo.address = groupInfo.groupSelection || groupInfo.address;
        delete groupInfo.groupSelection;

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
    //const initialAddress = Object.values(this.props.accessGroups).length > 0 ?
    //  Object.values(this.props.accessGroups)[0].address : "";
    const currentGroups = Object.values(this.state.groups[groupType]).map(group => group.address);
    const nextGroup = Object.values(this.props.accessGroups).find(group => !currentGroups.includes(group.address));
    return () => {
      this.setState({
        groups: {
          ...this.state.groups,
          [groupType]: {
            ...this.state.groups[groupType],
            [Id.next()]: {
              groupSelection: nextGroup ? nextGroup.address : "",
              knownGroup: !!nextGroup
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
        name="groupSelection"
        value={this.state.groups[groupType][groupId].groupSelection}
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
        <div key={"group-" + groupId} className="form-content">
          <label htmlFor="accessGroup">Group</label>
          { this.GroupSelection(groupType, groupId) }

          <label htmlFor="address">Address</label>
          <input name="address" disabled={group.knownGroup} value={group.address} onChange={this.HandleInputChange(groupType, groupId)} />

          <label htmlFor="removeGroup" />
          <Action className="action-compact action-wide delete-action" onClick={this.RemoveGroup(groupType, groupId)}>
            Remove Group
          </Action>
        </div>
      );
    });
  }

  GroupsForm(groupType) {
    return (
      <div>
        <h4>{groupType.capitalize() + "s"}</h4>
        <Action className="full-width" onClick={this.AddGroup(groupType)}>
          { `Add ${groupType.capitalize()} Group` }
        </Action>

        { this.Groups(groupType) }
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
          legend={"Manage Library Groups"}
          redirectPath={Path.dirname(this.props.match.url)}
          cancelPath={Path.dirname(this.props.match.url)}
          status={this.props.methodStatus.Submit}
          OnSubmit={this.HandleSubmit}
        >
          <div className="library-group-form">
            { this.GroupsForm("accessor") }
            <div className="section-separator" />
            { this.GroupsForm("contributor") }
            <div className="section-separator" />
            { this.GroupsForm("reviewer") }
          </div>
        </Form>
      </div>
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
