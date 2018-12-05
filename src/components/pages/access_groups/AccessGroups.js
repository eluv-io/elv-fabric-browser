import React from "react";
import { Link } from "react-router-dom";
import Path from "path";

import RequestPage from "../RequestPage";
import { LibraryCard } from "../../components/DisplayCards";

import AccessGroupIcon from "../../../static/icons/groups.svg";

class AccessGroups extends React.Component {
  constructor(props) {
    super(props);
    this.state = {};
  }

  componentDidMount() {
    this.setState({
      requestId: this.props.ListAccessGroups()
    });
  }

  AccessGroups() {
    const accessGroups = this.props.accessGroups;
    return (
      Object.keys(accessGroups).map(accessGroupName => {
        const accessGroup = accessGroups[accessGroupName];

        return (
          <div className="accessGroups" key={"accessGroup-" + accessGroupName}>
            <LibraryCard
              icon={AccessGroupIcon}
              link={Path.join("/access-groups", accessGroupName)}
              name={accessGroupName}
              infoText={"info text here"}
              description={accessGroup.description}
              title={"Access Group " + accessGroupName}/>
          </div>
        );
      })
    )
  }

  PageContent() {
    return (
      <div className="page-container contents-page-container">
        <div className="actions-container">
          <Link to="/access-groups/create" className="action" >New Access Group</Link>
        </div>
        <h3 className="page-header">Access Groups</h3>
        { this.AccessGroups() }
      </div>
    );
  }

  render() {
    return (
      <RequestPage
        pageContent={this.PageContent()}
        requestId={this.state.requestId}
        requests={this.props.requests}
      />
    );
  }
}

export default AccessGroups;
