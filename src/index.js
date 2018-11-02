import React from "react";
import { render } from "react-dom";
import { Provider } from "react-redux";
import { createHashHistory } from "history";
import { createStore, applyMiddleware } from "redux";
import Thunk from "redux-thunk";
import { connectRouter } from "connected-react-router";

import RootReducer from "./reducers";
import App from "./components/App";

const history = createHashHistory();

const store = createStore(
  connectRouter(history)(RootReducer),
  applyMiddleware(Thunk)
);

render(
  <Provider store={store}>
    <App history={history} />
  </Provider>,
  document.getElementById("app")
);

