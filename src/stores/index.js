import {configure, flow, makeAutoObservable} from "mobx";
import {FrameClient} from "@eluvio/elv-client-js/src/FrameClient";

import LibraryStore from "@/stores/LibraryStore";
import RouterStore from "@/stores/RouterStore";
import EventsStore from "@/stores/EventsStore";
import ContractsStore from "@/stores/ContractStore";
import GroupsStore from "@/stores/GroupStore";
import TypeStore from "@/stores/TypeStore";
import ObjectStore from "@/stores/ObjectStore";
import NotificationStore from "@/stores/NotificationStore";
import ContentStore from "@/stores/ContentStore";

// Force strict mode so mutations are only allowed within actions.
configure({
  enforceActions: "always"
});

class RootStore {
  client;
  currentAccountAddress;

  constructor() {
    makeAutoObservable(this);

    this.InitializeClient();

    this.contractStore = new ContractsStore(this);
    this.eventsStore = new EventsStore(this);
    this.groupStore = new GroupsStore(this);
    this.libraryStore = new LibraryStore(this);
    this.notificationStore = new NotificationStore(this);
    this.objectStore = new ObjectStore(this);
    this.routerStore = new RouterStore(this);
    this.typeStore = new TypeStore(this);
    this.contentStore = new ContentStore(this);
  }

  InitializeClient = flow(function * () {
    this.client = new FrameClient({
      target: window.parent,
      timeout: 240
    });

    this.currentAccountAddress = yield this.client.CurrentAccountAddress();
  });
}

const store = new RootStore();

export const rootStore = store;
export const contractStore = store.contractStore;
export const eventsStore = store.eventsStore;
export const groupStore = store.groupStore;
export const libraryStore = store.libraryStore;
export const notificationStore = store.notificationStore;
export const objectStore = store.objectStore;
export const routeStore = store.routerStore;
export const typeStore = store.typeStore;
export const contentStore = store.contentStore;

window.rootStore = store;
