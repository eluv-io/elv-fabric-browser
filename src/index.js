import "./static/stylesheets/app.scss";

import React from "react";
import { render } from "react-dom";
import { Provider } from "react-redux";
import { createHashHistory } from "history";
import {createStore, applyMiddleware, compose} from "redux";
import Thunk from "redux-thunk";
import { ConnectedRouter } from "connected-react-router";

import RootReducer from "./reducers";

import "./utils/StringExtensions";
import ScrollToTop from "./router/ScrollToTop";
import NavigationBar from "./containers/NavigationBar";
import Notifications from "./containers/Notifications";
import Routes from "./router";
import Debug from "./components/Debug";

const history = createHashHistory();

const store = createStore(
  RootReducer(history),
  compose(
    applyMiddleware(Thunk)
  )
);

render(
  <Provider store={store}>
    <div className="app-container">
      <ConnectedRouter history={history}>
        <ScrollToTop>
          <div className="view-container">
            <NavigationBar />
            <Notifications />
            <Routes />
          </div>
        </ScrollToTop>
      </ConnectedRouter>
    </div>
  </Provider>,
  document.getElementById("app")
);

