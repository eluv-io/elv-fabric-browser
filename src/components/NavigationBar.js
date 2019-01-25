import React from "react";
import { Link } from "react-router-dom";

import ContentIcon from "../static/icons/content.svg";
import GroupsIcon from "../static/icons/groups.svg";
import ContentTypeIcon from "../static/icons/content_types.svg";
import ContractsIcon from "../static/icons/contracts.svg";
import LogsIcon from "../static/icons/logs.svg";
import {Icon} from "./components/Icons";

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
        link: "logs",
        text: "Logs",
        icon: LogsIcon
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
            <Icon className="navbar-link-icon" src={linkInfo.icon} />
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
        <nav className="navbar-links-container" role="navigation">
          {NavigationBar.Links().map((linkInfo) => {
            return ( this.NavLink({linkInfo: linkInfo}) );
          })}
        </nav>
      </div>
    );
  }
}

export default NavigationBar;
