import "../static/stylesheets/app.scss";

import React from "react";
import {ConnectedRouter} from "connected-react-router";
import Notifications from "../containers/Notifications";
import NavigationBar from "../containers/NavigationBar";
import Routes from "../router";
import Debug from "./Debug";
import ScrollToTop from "../router/ScrollToTop";

class App extends React.Component {
  render() {
    return (
      <div className="app-container">
        <ConnectedRouter history={this.props.history}>
          <ScrollToTop>
            <div className="view-container">
              <NavigationBar />
              <Notifications />
              <Routes />
            </div>
          </ScrollToTop>
        </ConnectedRouter>
        <Debug />
      </div>
    );
  }
}

export default App;
