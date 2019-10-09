import "./static/stylesheets/app.scss";

import React from "react";
import { render } from "react-dom";
import HashRouter from "react-router-dom/es/HashRouter";

import "./utils/StringExtensions";
import "elv-components-js/src/utils/LimitedMap";

import ScrollToTop from "./router/ScrollToTop";
import NavigationBar from "./components/NavigationBar";
import Notifications from "./components/Notifications";
import Routes from "./router";

import * as Stores from "./stores";
import {Provider} from "mobx-react";

render(
  <React.Fragment>
    <Provider {...Stores}>
      <div className="app-container">
        <HashRouter>
          <ScrollToTop>
            <div className="view-container">
              <NavigationBar />
              <Notifications />
              <Routes />
            </div>
          </ScrollToTop>
        </HashRouter>
      </div>
    </Provider>
    <div className="app-version">
      {EluvioConfiguration.version}
    </div>
  </React.Fragment>,
  document.getElementById("app")
);

