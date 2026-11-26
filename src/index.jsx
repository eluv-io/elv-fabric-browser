import "@/assets/stylesheets/reset.scss";

import "@mantine/core/styles.css";
import "mantine-datatable/styles.css";

import "@/assets/stylesheets/variables.css";
import "@/assets/stylesheets/base.scss";

import {createRoot} from "react-dom/client";
import {MantineProvider} from "@mantine/core";
import UrlJoin from "url-join";

import "@/utils/StringExtensions";

import NavigationBar from "@/components/NavigationBar.jsx";
import Notifications from "@/components/Notifications.jsx";
import Routes from "./Routes";
import {ModalsProvider} from "@mantine/modals";
import MantineTheme from "../MantineTheme";
import {useEffect, useState} from "react";
import {ConfirmModal} from "@/components/Confirm";

const AppContent = () => {
  const [ready, setReady] = useState(false);

  // Handle redirect from hash (set by core)
  useEffect(() => {
    if(window.location.hash) {
      window.location.pathname = window.location.hash.replace("#", "");
      window.location.hash = "";
      setTimeout(() => setReady(true), 250);
    } else {
      setReady(true);
    }
  }, []);

  if(!ready) {
    return null;
  }

  return (
    <>
      <NavigationBar />
      <div className="app__content">
        <Routes />
      </div>
      <Notifications />
    </>
  );
};

const App = () => {
  if(window.self === window.top) {
    // Not in Core frame - Redirect
    window.location = UrlJoin(EluvioConfiguration.coreUrl, "/", window.location.pathname);
    return;
  }

  const root = createRoot(document.getElementById("app"));

  root.render(
    <MantineProvider theme={MantineTheme}>
      <ModalsProvider
        modals={{confirm: ConfirmModal}}
      >
        <AppContent />
      </ModalsProvider>
    </MantineProvider>
  );
};

App();

