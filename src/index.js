import React from "react";
import { render } from "react-dom";
import { Provider } from "react-redux";
import { createHashHistory } from "history";
import { createStore, applyMiddleware } from "redux";
import Thunk from "redux-thunk";
import { connectRouter } from "connected-react-router";

import RootReducer from "./reducers";

import "./utils/StringExtensions";
import AppContainer from "./containers/AppContainer";

const history = createHashHistory();

const store = createStore(
  connectRouter(history)(RootReducer),
  applyMiddleware(Thunk)
);

render(
  <Provider store={store}>
    <AppContainer history={history} />
  </Provider>,
  document.getElementById("app")
);

