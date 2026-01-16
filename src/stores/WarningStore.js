import {action, computed, observable} from "mobx";

const DISMISSED_WARNINGS_KEY = "app_dismissed_warnings";
const ID_PREFIX = "WARN_";

class WarningStore {
  @observable dismissedIds = {};
  @observable currentWarnings = {};

  constructor(rootStore) {
    this.rootStore = rootStore;
    this.LoadDismissedIds();
  }

  @action
  AddWarning({warningTitle, objectId, message}) {
    const uniqueId = `${ID_PREFIX}${warningTitle}_${objectId}`;

    if(!this.currentWarnings[uniqueId]) {
      this.currentWarnings[uniqueId] = {
        objectId,
        message: message,
        title: warningTitle,
        id: uniqueId
      };
    }
  }

  @action
  RemoveWarning(warningId) {
    if(this.currentWarnings.hasOwnProperty(warningId)) {
      delete this.currentWarnings[warningId];
    }
  }

  @action
  DismissWarning(warningId) {
    this.dismissedIds[warningId] = true;
    this.SaveDismissedIds();
  }

  @computed
  get activeWarnings() {
    return Object.values(this.currentWarnings)
      .filter(warning => !this.dismissedIds[warning.id]);
  }

  @action
  LoadDismissedIds() {
    try {
      const storedData = localStorage.getItem(DISMISSED_WARNINGS_KEY);

      if(storedData) {
        this.dismissedIds = JSON.parse(storedData);
      }
    } catch(error) {
      // eslint-disable-next-line no-console
      console.error("Could not load dismissed IDs from localStorage", error);
    }
  }

  SaveDismissedIds() {
    try {
      localStorage.setItem(DISMISSED_WARNINGS_KEY, JSON.stringify(this.dismissedIds));
    } catch(error) {
      // eslint-disable-next-line no-console
      console.error("Unable to save dismissed notifications to localStorage", error);
    }
  }
}

export default WarningStore;
