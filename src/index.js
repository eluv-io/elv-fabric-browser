import "./static/stylesheets/app.scss";

import React from "react";
import { render } from "react-dom";
import {HashRouter} from "react-router-dom";
import UrlJoin from "url-join";

import "./utils/StringExtensions";
import "elv-components-js/src/utils/LimitedMap";

import {InitializeColorScheme} from "./utils/ColorScheme";
import ScrollToTop from "./router/ScrollToTop";
import NavigationBar from "./components/NavigationBar";
import Notifications from "./components/Notifications";
import Routes from "./router";

import * as Stores from "./stores";
import {Provider} from "mobx-react";

// Ask core what colour scheme it is showing, and keep listening for changes.
// Runs before render so the first paint is already in the right scheme rather
// than flashing light. See utils/ColorScheme.js for the contract.
InitializeColorScheme();

const App = () => {
  if(window.self === window.top) {
    // Not in Core frame - Redirect
    window.location = UrlJoin(EluvioConfiguration.coreUrl, "/", window.location.hash);
    return;
  }

  return (
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
        { EluvioConfiguration.version }
      </div>
    </React.Fragment>
  );
};

render(
  <App />,
  document.getElementById("app")
);

