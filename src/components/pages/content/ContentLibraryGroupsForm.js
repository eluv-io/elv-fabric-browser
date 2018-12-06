import React from "react";
import RequestForm from "../../forms/RequestForm";
import RequestPage from "../RequestPage";
import Path from "path";
import Id from "../../../utils/Id";

class ContentLibraryGroupsForm extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      libraryId: this.props.libraryId || this.props.match.params.libraryId,
      name: "",
      description: "",
      submitRequestId: undefined,
      loadRequestId: undefined,
    };

    this.RequestComplete = this.RequestComplete.bind(this);
    this.HandleInputChange = this.HandleInputChange.bind(this);
    this.HandleSubmit = this.HandleSubmit.bind(this);
    this.AddGroup = this.AddGroup.bind(this);
  }

  componentDidMount() {
    this.setState({
      loadRequestId: this.props.WrapRequest({
        todo: async () => {
          await this.props.ListAccessGroups();
          await this.props.GetContentLibrary({libraryId: this.state.libraryId})
        }
      })
    });
  }

  RequestComplete() {
    const contentLibrary = this.props.contentLibraries[this.state.libraryId];

    // Attach IDs to each existing group
    // Form:
    //  {
    //    accessors: { 1: {...groupInfo}, 2: {...groupInfo}, ...},
    //    ...
    /// }
    let libraryGroups = {};
    Object.keys(contentLibrary.groups).map(groupType => {
      let libraryGroup = {};
      Object.values(contentLibrary.groups[groupType]).forEach(group => {
        const groupExists = Object.values(this.props.accessGroups.accessGroups)
          .some(existingGroup => group.address === existingGroup.address);

        libraryGroup[Id.next()] = {
          ...group,
          hideAddress: groupExists
        };
      });

      libraryGroups[groupType] = libraryGroup;
    });

    this.setState({
      contentLibrary,
      groups: libraryGroups,
      isOwner: this.props.currentAccountAddress.toLowerCase() === contentLibrary.owner.toLowerCase(),
      originalGroups: contentLibrary.groups
    });
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
    }
  }

  HandleSubmit() {
    let libraryGroups = {};
    Object.keys(this.state.groups).map(groupType => {
      libraryGroups[groupType] = Object.values(this.state.groups[groupType]);
    });

    this.setState({
      submitRequestId: this.props.WrapRequest({
        todo: async () => {
          await this.props.UpdateContentLibraryGroups({
            libraryId: this.state.libraryId,
            groups: libraryGroups,
            originalGroups: this.state.originalGroups
          });
        }
      })
    });
  }

  AddGroup(groupType) {
    const initialAddress = Object.values(this.props.accessGroups.accessGroups).length > 0 ?
      Object.values(this.props.accessGroups.accessGroups)[0].address : "";
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
    }
  }

  RemoveGroup(groupType, groupId) {
    return () => {
      let groups = this.state.groups;
      delete groups[groupType][groupId];

      this.setState({
        groups
      })
    }
  }

  GroupSelection(groupType, groupId) {
    let options = (
      Object.values(this.props.accessGroups.accessGroups).map(accessGroup => {
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
        name="address"
        value={this.state.groups[groupType][groupId].address}
        onChange={this.HandleInputChange(groupType, groupId)}
      >
        { options }
      </select>
    )
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
            <label className="label" htmlFor="removeGroup"></label>
            <div className="actions-container compact">
              <button
                className="action action-compact action-wide delete-action"
                type="button"
                onClick={this.RemoveGroup(groupType, groupId)}
              >
                Remove Group
              </button>
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
          <label className="label" htmlFor="addGroup" ></label>
          <div className="actions-container left">
            <button className="action action-compact action-full-width" type="button" onClick={this.AddGroup(groupType)}>
              { `Add ${groupType.capitalize()} Group` }
            </button>
          </div>
        </div>

        { this.Groups(groupType) }
      </div>
    );
  }

  FormContent() {
    return (
      <div className="library-group-form">
        <h4>Accessors</h4>
        { this.GroupsForm("accessor") }
        <h4>Contributors</h4>
        { this.GroupsForm("contributor") }
        <h4>Reviewers</h4>
        { this.GroupsForm("reviewer") }
      </div>
    );
  }

  PageContent() {
    if(!this.state.contentLibrary) { return null; }

    return (
      <RequestForm
        requests={this.props.requests}
        requestId={this.state.submitRequestId}
        legend={"Manage Library Groups"}
        formContent={this.FormContent()}
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

export default ContentLibraryGroupsForm;
