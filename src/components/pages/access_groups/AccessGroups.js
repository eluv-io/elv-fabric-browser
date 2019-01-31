import React from "react";
import Path from "path";

import RequestPage from "../RequestPage";

import AccessGroupIcon from "../../../static/icons/groups.svg";
import {PageHeader} from "../../components/Page";
import Action from "../../components/Action";
import Listing from "../../components/Listing";

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
    const accessGroups = Object.values(this.props.accessGroups).map(accessGroup => {
      let members = Object.keys(accessGroup.members).length;
      members = members === 1 ? members + " member" : members + " members";

      return {
        id: accessGroup.address,
        title: accessGroup.name,
        description: accessGroup.description,
        status: members,
        icon: AccessGroupIcon,
        link: Path.join(this.props.match.url, accessGroup.address)
      };
    });

    return <Listing pageId="AccessGroups" content={accessGroups} noIcon={true} /> ;
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
