import "@/assets/stylesheets/defaults.scss";
import "@/assets/stylesheets/components.scss";
import "@/assets/stylesheets/layout.scss";
import "@/assets/stylesheets/modals.scss";
import "@/assets/stylesheets/navbar.scss";
import "@/assets/stylesheets/notifications.scss";
import "@/assets/stylesheets/content.scss";
import "@/assets/stylesheets/labels.scss";
import "@/assets/stylesheets/events.scss";
import "@/assets/stylesheets/file_browser.scss";
import "@/assets/stylesheets/listing.scss";
import "@/assets/stylesheets/forms.scss";
import "@/assets/stylesheets/content_browser.scss";
import "@/assets/stylesheets/search_form.scss";

import React from "react";
import {createRoot} from "react-dom/client";
import UrlJoin from "url-join";

import "./utils/StringExtensions";

import NavigationBar from "./components/NavigationBar.jsx";
import Notifications from "./components/Notifications.jsx";
//import Routes from "./router";

import * as Stores from "@/stores/index";

const App = () => {
  if(window.self === window.top) {
    // Not in Core frame - Redirect
    window.location = UrlJoin(EluvioConfiguration.coreUrl, "/", window.location.hash);
    return;
  }

  const root = createRoot(document.getElementById("app"));

  root.render(
    <div className="app-container">
      <div className="view-container">
        <NavigationBar />
        <Notifications />
        Test
        { /* <Routes /> */ }
      </div>
    </div>
  );
};

App();

