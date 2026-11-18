import NavStyles from "@/assets/stylesheets/modules/nav.module.scss";

import ImageIcon from "@/components/ImageIcon";
import {observer} from "mobx-react";
import {routeStore} from "@/stores/index";
import {CreateModuleClassMatcher} from "@/utils/Helpers";
import {Linkish} from "@/components/Components";

import ContentIcon from "@/assets/icons/content.svg";
import GroupsIcon from "@/assets/icons/groups.svg";
import ContentTypeIcon from "@/assets/icons/content_types.svg";
import ContractsIcon from "@/assets/icons/contracts.svg";
import EventsIcon from "@/assets/icons/logs.svg";

const S = CreateModuleClassMatcher(NavStyles);

const links = [
  {
    path: "/content",
    text: "Content",
    rootPath: true,
    icon: ContentIcon
  },
  {
    path: "/access-groups",
    text: "Access Groups",
    icon: GroupsIcon
  },
  {
    path: "/content-types",
    text: "Content Types",
    icon: ContentTypeIcon
  },
  {
    path: "/contracts",
    text: "Contracts",
    icon: ContractsIcon
  },
  {
    path: "/events",
    text: "Events",
    icon: EventsIcon
  }
];

const NavLink = observer(({path, text, icon}) => {
  return (
    <Linkish
      to={path}
      title={text}
      className={S("link", routeStore.path?.startsWith(path) ? "link--active" : "")}
    >
      <ImageIcon className={S("link__icon")} icon={icon} />
    </Linkish>
  );
});

const NavigationBar = observer(() => {
  return (
    <div className={S("nav")}>
      <nav className={S("links")} role="navigation">
        {
          links.map(link =>
            <NavLink key={`link-${link.path}`} {...link} />
          )
        }
      </nav>
    </div>
  );
});

export default NavigationBar;
