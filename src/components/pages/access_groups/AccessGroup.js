import React from "react";
import { Link } from "react-router-dom";
import Path from "path";

import RequestPage from "../RequestPage";
import {LabelledField} from "../../components/LabelledField";
import ClippedText from "../../components/ClippedText";
import Redirect from "react-router/es/Redirect";

class AccessGroup extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      accessGroupName: this.props.match.params.accessGroupName,
      visibleElements: {}
    };

    this.RequestComplete = this.RequestComplete.bind(this);
    this.DeleteAccessGroup = this.DeleteAccessGroup.bind(this);
  }

  componentDidMount() {
    this.setState({
      requestId: this.props.ListAccessGroups()
    });
  }

  ToggleElement(methodName) {
    this.setState({
      visibleElements: {
        ...this.state.visibleElements,
        [methodName]: !this.state.visibleElements[methodName]
      }
    });
  }

  ToggleButton(label, id) {
    const toggleVisible = () => this.ToggleElement(id);
    const visible = this.state.visibleElements[id];
    const toggleButtonText = (visible ? "Hide " : "Show ") + label;

    return (
      <div className="actions-container">
        <button className={"action action-compact action-wide " + (visible ? "" : "secondary")} onClick={toggleVisible}>{ toggleButtonText }</button>
      </div>
    );
  }

  RequestComplete() {
    if(this.state.deleting && this.props.requests[this.state.requestId].completed) {
      this.setState({
        deleted: true
      });
    } else {
      this.setState({
        accessGroup: this.props.accessGroups[this.state.accessGroupName]
      });
    }
  }

  DeleteAccessGroup(accessGroupName) {
    if (confirm("Are you sure you want to delete this access group?")) {
      this.setState({
        requestId: this.props.RemoveAccessGroup({name: accessGroupName, contractAddress: this.state.accessGroup.address}),
        deleting: true
      });
    }
  }

  AccessGroupMembers() {
    return Object.values(this.state.accessGroup.members).map(member => {
      return (
        <div className="member-info indented" key={"member-" + member.address}>
          <h4>{member.name}</h4>
          <LabelledField label="Address" value={member.address} />
          <LabelledField label="Type" value={member.manager ? "Manager" : "Member"} />
        </div>
      );
    });
  }

  Actions() {
    const isManager = Object.values(this.state.accessGroup.members)
      .some(member => member.address.toLowerCase() === this.props.currentAccountAddress.toLowerCase() && member.manager);
    const isCreator = this.props.currentAccountAddress.toLowerCase() === this.state.accessGroup.creator.toLowerCase();

    let editButton;
    let deleteButton;
    if(isCreator) {
      editButton = <Link to={Path.join(this.props.match.url, "edit")} className="action" >Edit Access Group</Link>;
      deleteButton = <button className="action delete-action" onClick={() => this.DeleteAccessGroup(this.state.accessGroupName)}>Delete Access Group</button>;
    }

    let manageButton;
    if(isManager || isCreator) {
      manageButton = <Link to={Path.join(this.props.match.url, "members")} className="action" >Manage Members</Link>;
    }

    return (
      <div className="actions-container">
        <Link to={Path.dirname(this.props.match.url)} className="action secondary" >Back</Link>
        { editButton }
        { manageButton }
        { deleteButton }
      </div>
    );
  }

  PageContent() {
    if(!this.state.accessGroup){ return null; }

    this.state.accessGroup.creator = this.state.accessGroup.creator  || "";

    if(this.state.deleted) {
      return <Redirect push to={Path.dirname(this.props.match.url)}/>;
    }

    const description = <ClippedText className="object-description" text={this.state.accessGroup.description} />;

    return (
      <div className="page-container access-group-page-container">
        { this.Actions() }
        <div className="object-display">
          <h3 className="page-header">{ this.state.accessGroupName }</h3>
          <div className="label-box">
            <LabelledField label="Creator Address" value={this.state.accessGroup.creator} />
            <LabelledField label="Description" value={description} />
            <LabelledField label="Contract Address" value={this.state.accessGroup.address} />
            <h3>Members</h3>
            { this.AccessGroupMembers() }
          </div>
        </div>
      </div>
    );
  }

  render() {
    return (
      <RequestPage
        pageContent={this.PageContent()}
        requestId={this.state.requestId}
        requests={this.props.requests}
        OnRequestComplete={this.RequestComplete}
      />
    );
  }
}

export default AccessGroup;
