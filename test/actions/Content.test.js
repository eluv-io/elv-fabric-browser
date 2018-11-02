import configureStore from "redux-mock-store";
import thunk from "redux-thunk";

import {
  CreateContentLibrary,
  GetFullContentObject,
  ListContentLibraries,
  ListContentObjects,

} from "../../src/actions/Content";

// Override Fabric library with mock version
import FabricMock from "../mocks/FabricRequester.mock";
import ElvWallet from "../mocks/ElvWallet.mock";
import {AwaitRequest} from "../utils";

const mockStore = configureStore([ thunk ]);
const store = mockStore();

// Listing and creating content libraries and objects
describe("Content Actions", () => {
  beforeEach(() => {
    store.clearActions();
    FabricMock.spy.clearSpyFunctions();
  });

  test("List content libraries", async () => {
    const requestId = store.dispatch(ListContentLibraries());

    expect(typeof requestId).toBe("number");

    expect(await AwaitRequest({ store, requestId })).toBe(true);

    expect(FabricMock.spy.ListContentLibraries).toHaveBeenCalledTimes(1);
    expect(FabricMock.spy.ListContentObjects).toHaveBeenCalledTimes(1);
    expect(store.getActions()).toMatchSnapshot();
  });

  test("List content objects", async () => {
    const requestId = store.dispatch(ListContentObjects({
      libraryId: "libraryId"
    }));

    expect(typeof requestId).toBe("number");

    expect(await AwaitRequest({ store, requestId })).toBe(true);

    expect(FabricMock.spy.ListContentObjects).toHaveBeenCalledTimes(1);
    expect(store.getActions()).toMatchSnapshot();
  });

  test("Get content object", async () => {
    const requestId = store.dispatch(GetFullContentObject({
      libraryId: "libraryId",
      contentHash: "contentHash"
    }));

    expect(typeof requestId).toBe("number");

    expect(await AwaitRequest({ store, requestId })).toBe(true);

    expect(FabricMock.spy.GetContentObjectMetadata).toHaveBeenCalledTimes(1);
    expect(store.getActions()).toMatchSnapshot();
  });

  test("Create content library", async () => {
    const wallet = new ElvWallet();

    const signer = wallet.AddAccount({
      accountName: "Alice",
      privateKey: "0x0000000000000000000000000000000000000000000000000000000000000000"
    });

    const requestId = store.dispatch(CreateContentLibrary({
      name: "Test content library",
      description: "Content library description",
      signer
    }));

    expect(typeof requestId).toBe("number");

    expect(await AwaitRequest({ store, requestId })).toBe(true);

    expect(FabricMock.spy.CreateContentLibrary).toHaveBeenCalledTimes(1);
    expect(store.getActions()).toMatchSnapshot();
  });
});
