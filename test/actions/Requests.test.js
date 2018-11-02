import configureStore from "redux-mock-store";
import thunk from "redux-thunk";
import { WrapRequest } from "../../src/actions/Requests";
import {AwaitRequest} from "../utils";

const mockStore = configureStore([ thunk ]);
const store = mockStore();

describe("Request wrapper", () => {
  beforeEach(() => {
    store.clearActions();
  });

  test("Successful request", async () => {
    const requestId = WrapRequest({
      dispatch: store.dispatch,
      domain: "test-domain",
      action: "test-action",
      todo: () => {
        return "Successful action";
      }
    });

    expect(typeof requestId).toBe("number");

    expect(await AwaitRequest({ store, requestId})).toBe(true);

    expect(store.getActions()).toMatchSnapshot();
  });

  test("Failed request", async () => {
    const todo = () => { throw Error("Invalid request"); };
    const requestId = WrapRequest({
      dispatch: store.dispatch,
      domain: "test-domain",
      action: "test-action",
      todo
    });

    expect(typeof requestId).toBe("number");

    expect(await AwaitRequest({ store, requestId})).toBe(false);

    expect(store.getActions()).toMatchSnapshot();
  });
});
