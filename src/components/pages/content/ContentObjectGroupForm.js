import React from "react";
import Path from "path";
import {Action, Form} from "elv-components-js";
import AsyncComponent from "../../components/AsyncComponent";
import {inject, observer} from "mobx-react";
import Fabric from "../../../clients/Fabric";

@inject("objectStore")
@inject("groupStore")
@observer
class ContentObjectGroupForm extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      groups: [],
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
    const permissions = (this.props.objectStore.object.groupPermissions[event.target.value] || {}).permissions || [];

    this.setState({
      groupAddress: event.target.value,
      see: !!permissions.includes("see"),
      access: !!permissions.includes("access"),
      manage: !!permissions.includes("manage")
    });
  }

  async HandleSubmit() {
    await this.props.objectStore.UpdateContentObjectGroupPermissions({
      objectId: this.props.objectStore.objectId,
      groupAddress: this.state.groupAddress,
      see: this.state.see,
      access: this.state.access,
      manage: this.state.manage
    });
  }

  Groups() {
    let options = this.state.groups.map(group =>
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
          disabled={Object.keys(this.props.groupStore.accessGroups).includes(this.state.groupAddress)}
          onChange={event => this.setState({groupAddress: event.target.value})}
        />
      </React.Fragment>
    );
  }

  PageContent() {
    const backPath = Path.dirname(this.props.match.url);

    return (
      <div className="page-container">
        <div className="actions-container manage-actions">
          <Action type="link" to={Path.dirname(this.props.match.url)} className="secondary">Back</Action>
        </div>
        <Form
          legend={`Manage access group permissions for '${this.props.objectStore.object.name || this.props.objectStore.objectId}'`}
          redirectPath={backPath}
          cancelPath={backPath}
          OnSubmit={this.HandleSubmit}
          className="small-form"
        >
          <div className="form-content">
            { this.Groups() }

            <label htmlFor="accessor">See</label>
            <input
              type="checkbox"
              checked={this.state.see}
              onChange={() => this.setState({see: !this.state.see})}
            />

            <label htmlFor="contributor">Access</label>
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
      </div>
    );
  }

  render() {
    return (
      <AsyncComponent
        Load={
          async () => {
            await this.props.groupStore.ListAccessGroups({params: {}});

            await this.props.objectStore.ContentObject({objectId: this.props.objectStore.objectId});
            await this.props.objectStore.ContentObjectGroupPermissions({objectId: this.props.objectStore.objectId});

            const contractAddress = Fabric.utils.HashToAddress(this.props.objectStore.objectId);
            const groups = Object.values(this.props.groupStore.accessGroups)
              .filter(group => !Fabric.utils.EqualAddress(group.address, contractAddress));

            this.setState({groups});

            const initialGroupAddress = groups[0] && groups[0].address;

            if(initialGroupAddress) {
              this.HandleGroupChange({target: {value: initialGroupAddress}});
            }
          }
        }
        render={this.PageContent}
      />
    );
  }
}

export default ContentObjectGroupForm;
