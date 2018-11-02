import React from "react";
import { Link } from "react-router-dom";
import InlineSVG from "svg-inline-react";

import ContentIcon from "../static/icons/content.svg";
import AccountsIcon from "../static/icons/accounts.svg";
import GroupsIcon from "../static/icons/groups.svg";
import ContentTypeIcon from "../static/icons/content_types.svg";
import ContractsIcon from "../static/icons/contracts.svg";
import ServicesIcon from "../static/icons/services.svg";

class NavigationBar extends React.Component {
  static Links() {
    return [
      {
        link: "content",
        text: "Content",
        rootPath: true,
        icon: ContentIcon
      },
      {
        link: "accounts",
        text: "Accounts",
        icon: AccountsIcon
      },
      {
        link: "access-groups",
        text: "Access Groups",
        icon: GroupsIcon
      },
      {
        link: "content-types",
        text: "Content Types",
        icon: ContentTypeIcon
      },
      {
        link: "contracts",
        text: "Contracts",
        icon: ContractsIcon
      },
      {
        link: "services",
        text: "Services",
        icon: ServicesIcon
      }
    ];
  }

  NavLink({linkInfo}) {
    let active = linkInfo.rootPath && !this.props.currentBasePath ||
      this.props.currentBasePath === linkInfo.link;
    return (
      <div key={"navbar-link-" + linkInfo.link} className="navbar-link-container">
        <Link to={"/" + linkInfo.link} className={"navbar-link " + (active ? "active" : "")}>
          <span className="navbar-link-span">
            <InlineSVG className="icon navbar-link-icon" src={linkInfo.icon} />
            <div className="navbar-link-text">
              {linkInfo.text}
            </div>
          </span>
        </Link>
      </div>
    );
  }

  render() {
    return (
      <div className="navbar-container">
        <div className="navbar-links-container">
          {NavigationBar.Links().map((linkInfo) => {
            return ( this.NavLink({linkInfo: linkInfo}) );
          })}
        </div>
      </div>
    );
  }
}

export default NavigationBar;
