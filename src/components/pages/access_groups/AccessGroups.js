import React from "react";
import Path from "path";

import RequestPage from "../RequestPage";
import { LibraryCard } from "../../components/DisplayCards";

import AccessGroupIcon from "../../../static/icons/groups.svg";
import {PageHeader} from "../../components/Page";
import Action from "../../components/Action";

class AccessGroups extends React.Component {
  constructor(props) {
    super(props);
    this.state = {};

    this.PageContent = this.PageContent.bind(this);
  }

  componentDidMount() {
    this.setState({
      requestId: this.props.WrapRequest({
        todo: async () => {
          await this.props.ListAccessGroups();
        }
      })
    });
  }

  AccessGroups() {
    const accessGroups = this.props.accessGroups;
    return (
      Object.values(accessGroups).map(accessGroup => {
        return (
          <div className="accessGroups" key={"accessGroup-" + accessGroup.address}>
            <LibraryCard
              icon={AccessGroupIcon}
              link={Path.join("/access-groups", accessGroup.address)}
              name={accessGroup.name}
              isOwner={accessGroup.isOwner}
              infoText={"info text here"}
              description={accessGroup.description}
              title={"Access Group " + accessGroup.name}/>
          </div>
        );
      })
    );
  }

  PageContent() {
    return (
      <div className="page-container contents-page-container">
        <div className="actions-container">
          <Action type="link" to="/access-groups/create">New Access Group</Action>
        </div>
        <PageHeader header="Access Groups" />
        { this.AccessGroups() }
      </div>
    );
  }

  render() {
    return (
      <RequestPage
        pageContent={this.PageContent}
        requestId={this.state.requestId}
        requests={this.props.requests}
      />
    );
  }
}

export default AccessGroups;
