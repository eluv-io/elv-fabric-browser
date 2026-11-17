import "@mantine/core/styles.css";
import "@/assets/stylesheets/variables.css";
import "@/assets/stylesheets/base.scss";

import {createRoot} from "react-dom/client";
import UrlJoin from "url-join";
import {createTheme, MantineProvider} from "@mantine/core";

import "./utils/StringExtensions";

import NavigationBar from "./components/NavigationBar.jsx";
import Notifications from "./components/Notifications.jsx";
import Routes from "./Routes";

const theme = createTheme({
  /** Put your mantine theme override here */
});

const App = () => {
  if(window.self === window.top) {
    // Not in Core frame - Redirect
    window.location = UrlJoin(EluvioConfiguration.coreUrl, "/", window.location.hash);
    return;
  }

  const root = createRoot(document.getElementById("app"));

  root.render(
    <MantineProvider>
      <NavigationBar />
      <Notifications />
      <Routes />
    </MantineProvider>
  );
};

App();

