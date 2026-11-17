import React from "react";
import {AsyncComponent, Form, Modal} from "elv-components-js";
import {observer} from "mobx-react";
import Fabric from "../../../clients/Fabric";

import {objectStore} from "@/stores/index";
import {groupStore} from "@/stores/index";

class ContentObjectGroupForm extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      groupAddress: "",
      see: false,
      access: false,
      manage: false
    };

    this.PageContent = this.PageContent.bind(this);
    this.HandleGroupChange = this.HandleGroupChange.bind(this);
    this.HandleSubmit = this.HandleSubmit.bind(this);
  }

  HandleGroupChange(event) {
    const permissions = (objectStore.objectGroupPermissions[event.target.value] || {}).permissions || [];

    this.setState({
      groupAddress: event.target.value,
      see: !!permissions.includes("see"),
      access: !!permissions.includes("access"),
      manage: !!permissions.includes("manage")
    });
  }

  async HandleSubmit() {
    await objectStore.UpdateContentObjectGroupPermissions({
      objectId: objectStore.objectId,
      groupAddress: this.state.groupAddress,
      see: this.state.see,
      access: this.state.access,
      manage: this.state.manage
    });

    await this.props.LoadGroupPermissions();
  }

  Groups() {
    let options = this.FilteredGroups().map(group =>
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
        <select name="groupAddress" value={this.state.groupAddress} onChange={this.HandleGroupChange}>
          { options }
        </select>

        <label htmlFor="groupAddress">Address</label>
        <input
          name="groupAddress"
          value={this.state.groupAddress}
          disabled={Object.keys(groupStore.accessGroups).includes(this.state.groupAddress)}
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
              await objectStore.ContentObject({objectId: this.props.objectStore.objectId});
              await objectStore.ContentObjectGroupPermissions({objectId: this.props.objectStore.objectId});

              const initialGroupAddress = this.FilteredGroups()[0] && this.FilteredGroups()[0].address;

              if(initialGroupAddress) {
                this.HandleGroupChange({target: {value: initialGroupAddress}});
              }
            }
          }
          render={() => (
            <Form
              legend={`Manage access group permissions for '${objectStore.object ? this.props.objectStore.object.name : this.props.objectStore.objectId}'`}
              OnCancel={this.props.CloseModal}
              OnSubmit={this.HandleSubmit}
              OnComplete={this.props.CloseModal}
              className="small-form"
            >
              <div className="form-content">
                { this.Groups() }

                {
                  this.props.currentPage !== "accessGroup" &&
                  <>
                    <label htmlFor="accessor">See</label>
                    <input
                      type="checkbox"
                      checked={this.state.see}
                      onChange={() => this.setState({see: !this.state.see})}
                    />
                  </>
                }

                <label htmlFor="contributor">View</label>
                <input
                  type="checkbox"
                  checked={this.state.access}
                  onChange={() => this.setState({access: !this.state.access})}
                />

                <label htmlFor="reviewer">Manage</label>
                <input
                  type="checkbox"
                  checked={this.state.manage}
                  onChange={() => this.setState({manage: !this.state.manage})}
                />
              </div>
            </Form>
          )}
        />
      </Modal>
    );
  }

  FilteredGroups() {
    const contractAddress = Fabric.utils.HashToAddress(objectStore.objectId);
    return Object.values(groupStore.accessGroups)
      .filter(group => !Fabric.utils.EqualAddress(group.address, contractAddress));
  }

  render() {
    return this.PageContent();
  }
}

export default observer(ContentObjectGroupForm);
