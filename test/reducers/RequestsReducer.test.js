import RequestsReducer from "../../src/reducers/RequestsReducer";
import ActionTypes from "../../src/actions/ActionTypes";

describe("Request Reducer", () => {
  let domain = "test";
  let requestId = 222;
  let requestAction = "test_action";

  test("Initial state", () => {
    expect(RequestsReducer(undefined, {type: "@@INIT"})).toEqual({});
  });

  test("Submitted request", () => {
    const resultState = RequestsReducer(
      {},
      {
        type: ActionTypes.request.request.status.submitted,
        domain: domain,
        requestId: requestId,
        action: requestAction
      }
    );

    expect(resultState[domain]).toBeDefined();
    expect(Object.keys(resultState[domain]).length).toBe(1);
    expect(resultState[domain][requestId]).toBeDefined();
    expect(resultState[domain][requestId]["updatedAt"]).toBeDefined();
    expect(resultState[domain][requestId]).toEqual(
      expect.objectContaining({
        action: requestAction,
        loading: true,
        completed: false,
        error: false
      })
    );
  });

  test("Completed request", () => {
    const resultState = RequestsReducer(
      {},
      {
        type: ActionTypes.request.request.status.completed,
        domain: domain,
        requestId: requestId,
        action: requestAction
      }
    );

    expect(resultState[domain]).toBeDefined();
    expect(Object.keys(resultState[domain]).length).toBe(1);
    expect(resultState[domain][requestId]).toBeDefined();
    expect(resultState[domain][requestId]["updatedAt"]).toBeDefined();
    expect(resultState[domain][requestId]).toEqual(
      expect.objectContaining({
        action: requestAction,
        loading: false,
        completed: true,
        error: false
      })
    );
  });

  test("Error request", () => {
    const resultState = RequestsReducer(
      {},
      {
        type: ActionTypes.request.request.status.error,
        domain: domain,
        requestId: requestId,
        action: requestAction,
        error_message: "Request error"
      }
    );

    expect(resultState[domain]).toBeDefined();
    expect(Object.keys(resultState[domain]).length).toBe(1);
    expect(resultState[domain][requestId]).toBeDefined();
    expect(resultState[domain][requestId]["updatedAt"]).toBeDefined();
    expect(resultState[domain][requestId]).toEqual(
      expect.objectContaining({
        action: requestAction,
        loading: false,
        completed: false,
        error: true,
        error_message: "Request error"
      })
    );
  });

  test("Additional requests do not affect existing request state", () => {
    let resultState = RequestsReducer(
      {},
      {
        type: ActionTypes.request.request.status.submitted,
        domain: "domain",
        requestId: requestId++,
        action: requestAction
      }
    );

    resultState = RequestsReducer(
      resultState,
      {
        type: ActionTypes.request.request.status.completed,
        domain: "domain",
        requestId: requestId++,
        action: requestAction
      }
    );

    resultState = RequestsReducer(
      resultState,
      {
        type: ActionTypes.request.request.status.completed,
        domain: "otherdomain",
        requestId: requestId++,
        action: requestAction
      }
    );

    resultState = RequestsReducer(
      resultState,
      {
        type: ActionTypes.request.request.status.error,
        domain: "domain",
        requestId: requestId++,
        action: requestAction,
        error_message: "Request error"
      }
    );

    resultState = RequestsReducer(
      resultState,
      {
        type: ActionTypes.request.request.status.submitted,
        domain: "otherdomain",
        requestId: requestId++,
        action: requestAction
      }
    );


    resultState = RequestsReducer(
      resultState,
      {
        type: ActionTypes.request.request.status.error,
        domain: "otherdomain",
        requestId: requestId++,
        action: requestAction,
        error_message: "Request error"
      }
    );

    expect(Object.keys(resultState).length).toBe(2);
    expect(Object.keys(resultState["domain"]).length).toBe(3);
    expect(Object.keys(resultState["otherdomain"]).length).toBe(3);
  });
});
