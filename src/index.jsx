import "@/assets/stylesheets/reset.scss";

import "@mantine/core/styles.css";
import "mantine-datatable/styles.css";

import "@/assets/stylesheets/variables.css";
import "@/assets/stylesheets/base.scss";

import {createRoot} from "react-dom/client";
import {createTheme, MantineProvider} from "@mantine/core";
import UrlJoin from "url-join";

import "@/utils/StringExtensions";

import NavigationBar from "@/components/NavigationBar.jsx";
import Notifications from "@/components/Notifications.jsx";
import Routes from "./Routes";
import {ModalsProvider} from "@mantine/modals";

const theme = createTheme({
  /** Put your mantine theme override here */
});

const App = () => {
  if(window.self === window.top) {
    // Not in Core frame - Redirect
    window.location = UrlJoin(EluvioConfiguration.coreUrl, "/", window.location.pathname);
    return;
  }

  const root = createRoot(document.getElementById("app"));

  root.render(
    <MantineProvider theme={theme}>
      <ModalsProvider>
        <NavigationBar />
        <div className="app__content">
          <Routes />
        </div>
        <Notifications />
      </ModalsProvider>
    </MantineProvider>
  );
};

App();

