import {configure, observable, action, flow} from "mobx";
import {FrameClient} from "elv-client-js/src/FrameClient";

import LibraryStore from "./Library";
import RouterStore from "./Router";
import EventsStore from "./Events";
import ContractsStore from "./Contract";
import GroupsStore from "./Group";
import TypeStore from "./Type";
import ObjectStore from "./Object";
import NotificationStore from "./Notifications";

// Force strict mode so mutations are only allowed within actions.
configure({
  enforceActions: "always"
});

class RootStore {
  @observable client;
  @observable currentAccountAddress;

  constructor() {
    this.InitializeClient();

    this.contractStore = new ContractsStore(this);
    this.eventsStore = new EventsStore(this);
    this.groupStore = new GroupsStore(this);
    this.libraryStore = new LibraryStore(this);
    this.notificationStore = new NotificationStore(this);
    this.objectStore = new ObjectStore(this);
    this.routerStore = new RouterStore(this);
    this.typeStore = new TypeStore(this);
  }

  @action.bound
  InitializeClient = flow(function * () {
    this.client = new FrameClient({
      target: window.parent,
      timeout: 30
    });

    this.currentAccountAddress = yield this.client.CurrentAccountAddress();
  });
}

const rootStore = new RootStore();

export const root = rootStore;
export const contractStore = rootStore.contractStore;
export const eventsStore = rootStore.eventsStore;
export const groupStore = rootStore.groupStore;
export const libraryStore = rootStore.libraryStore;
export const notificationStore = rootStore.notificationStore;
export const objectStore = rootStore.objectStore;
export const routeStore = rootStore.routerStore;
export const typeStore = rootStore.typeStore;
