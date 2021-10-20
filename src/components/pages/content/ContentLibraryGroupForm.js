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
      accessor: false,
      reviewer: false,
      contributor: false
    };

    this.PageContent = this.PageContent.bind(this);
    this.HandleGroupChange = this.HandleGroupChange.bind(this);
    this.HandleSubmit = this.HandleSubmit.bind(this);
  }

  HandleGroupChange(event) {
    const permissions = this.props.libraryStore.library.groupPermissions[event.target.value] || {};

    this.setState({
      groupAddress: event.target.value,
      accessor: !!permissions.accessor,
      contributor: !!permissions.contributor,
      reviewer: !!permissions.reviewer
    });
  }

  async HandleSubmit() {
    await this.props.libraryStore.UpdateContentLibraryGroup({
      libraryId: this.props.libraryStore.libraryId,
      groupAddress: this.state.groupAddress,
      accessor: this.state.accessor,
      reviewer: this.state.reviewer,
      contributor: this.state.contributor
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
        <Form
          legend={`Manage access group permissions for '${this.props.libraryStore.library.name || this.props.libraryStore.libraryId}'`}
          OnCancel={this.props.CloseModal}
          OnComplete={this.props.CloseModal}
          OnSubmit={this.HandleSubmit}
          className="small-form"
        >
          <div className="form-content">
            { this.Groups() }

            <label htmlFor="accessor">Accessor</label>
            <input
              type="checkbox"
              checked={this.state.accessor}
              onChange={() => this.setState({accessor: !this.state.accessor})}
            />

            <label htmlFor="contributor">Contributor</label>
            <input
              type="checkbox"
              checked={this.state.contributor}
              onChange={() => this.setState({contributor: !this.state.contributor})}
            />

            <label htmlFor="reviewer">Reviewer</label>
            <input
              type="checkbox"
              checked={this.state.reviewer}
              onChange={() => this.setState({reviewer: !this.state.reviewer})}
            />
          </div>
        </Form>
      </Modal>
    );
  }

  render() {
    return (
      <AsyncComponent
        Load={
          async () => {
            await this.props.groupStore.ListAccessGroups({params: {}});
            await this.props.libraryStore.ContentLibrary({libraryId: this.props.libraryStore.libraryId});
            await this.props.LoadGroups();

            const initialGroupAddress = Object.keys(this.props.groupStore.accessGroups)[0];

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

export default ContentLibraryGroupForm;
