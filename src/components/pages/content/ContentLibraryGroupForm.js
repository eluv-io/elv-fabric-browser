import React from "react";
import {Form} from "elv-components-js";
import AsyncComponent from "../../components/AsyncComponent";
import {inject, observer} from "mobx-react";
import {Modal} from "elv-components-js";

@inject("libraryStore")
@inject("groupStore")
@observer
class ContentLibraryGroupForm extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      groupAddress: "",
      selectedPermission: ""
    };

    this.PageContent = this.PageContent.bind(this);
    this.HandleGroupChange = this.HandleGroupChange.bind(this);
    this.HandleSubmit = this.HandleSubmit.bind(this);
  }

  HandleGroupChange(event) {
    const permissions = this.props.libraryStore.library.groupPermissions[event.target.value] || {};

    this.setState({
      groupAddress: event.target.value,
      selectedPermission: (
        permissions.reviewer ? "MANAGE" : permissions.contributor ? "CONTRIBUTE" : permissions.accessor ? "VIEW" : ""
      )
    });
  }

  async HandleSubmit() {
    await this.props.libraryStore.UpdateContentLibraryGroup({
      libraryId: this.props.libraryStore.libraryId,
      groupAddress: this.state.groupAddress,
      accessor: this.state.selectedPermission === "VIEW",
      reviewer: this.state.selectedPermission === "MANAGE",
      contributor: this.state.selectedPermission === "CONTRIBUTE"
    });

    await this.props.LoadGroups();
  }

  Groups() {
    let options = Object.values(this.props.groupStore.accessGroups).map(group =>
      <option key={`group-${group.address}`} value={group.address}>{ group.name }</option>
    );

    options = (
      [
        ...options,
        <option key="group-address-other" value="">{"<other>"}</option>
      ]
    );

    return (
      <React.Fragment>
        <label htmlFor="groupAddress">Access Group</label>
        <select name="groupAddress" onChange={this.HandleGroupChange}>
          { options }
        </select>

        <label htmlFor="groupAddress">Address</label>
        <input
          name="groupAddress"
          value={this.state.groupAddress}
          disabled={Object.keys(this.props.groupStore.accessGroups).includes(this.state.groupAddress)}
          onChange={event => this.setState({groupAddress: event.target.value})}
        />
      </React.Fragment>
    );
  }

  PageContent() {
    return (
      <Modal
        closable={true}
        OnClickOutside={this.props.CloseModal}
      >
        <AsyncComponent
          Load={
            async () => {
              const initialGroupAddress = Object.keys(this.props.groupStore.accessGroups)[0];

              if(initialGroupAddress) {
                this.HandleGroupChange({target: {value: initialGroupAddress}});
              }
            }
          }
          render={() => (
            <Form
              legend={`Manage access group permissions for '${this.props.libraryStore.library.name || this.props.libraryStore.libraryId}'`}
              OnCancel={this.props.CloseModal}
              OnComplete={this.props.CloseModal}
              OnSubmit={this.HandleSubmit}
              className="small-form"
            >
              <div className="form-content">
                { this.Groups() }
              </div>

              <div className="radio-item">
                <input
                  type="radio"
                  id="view"
                  checked={this.state.selectedPermission === "VIEW"}
                  value={this.state.selectedPermission === "VIEW"}
                  onChange={() => this.setState({selectedPermission: "VIEW"})}
                />
                <div className="radio-label">
                  <label htmlFor="view">View</label>
                  <div className="radio-helper-text">
                    List content objects in the library. View library metadata.
                  </div>
                </div>
              </div>

              <div className="radio-item">
                <input
                  type="radio"
                  id="contribute"
                  checked={this.state.selectedPermission === "CONTRIBUTE"}
                  value={this.state.selectedPermission === "CONTRIBUTE"}
                  onChange={() => this.setState({selectedPermission: "CONTRIBUTE"})}
                />
                <div className="radio-label">
                  <label htmlFor="contribute">Contribute</label>
                  <div className="radio-helper-text">
                    List and create new content objects in the library. View library metadata.
                  </div>
                </div>
              </div>

              <div className="radio-item">
                <input
                  type="radio"
                  id="manage"
                  checked={this.state.selectedPermission === "MANAGE"}
                  value={this.state.selectedPermission === "MANAGE"}
                  onChange={() => this.setState({selectedPermission: "MANAGE"})}
                />
                <div className="radio-label">
                  <label htmlFor="manage">Manage</label>
                  <div className="radio-helper-text">
                    List, create and delete content objects in the library. Edit library metadata.
                  </div>
                </div>
              </div>
            </Form>
          )}
        />
      </Modal>
    );
  }

  render() {
    return this.PageContent();
  }
}

export default ContentLibraryGroupForm;
