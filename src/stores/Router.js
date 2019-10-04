import {observable, action, runInAction} from "mobx";
import {FormatAddress} from "../utils/Helpers";
import Fabric from "../clients/Fabric";

class RouterStore {
  @observable initialRoute;

  @observable path;

  @observable libraryId;
  @observable objectId;
  @observable contractAddress;

  constructor(rootStore) {
    this.rootStore = rootStore;

    Fabric.GetFramePath().then(path => runInAction(() => this.initialRoute = path));
  }

  @action.bound
  UpdateRoute(match) {
    this.initialRoute = undefined;
    this.path = match.url;
    this.libraryId = match.params.libraryId;
    this.objectId = match.params.objectId;
    this.contractName = match.params.contractName;
    this.contractAddress = FormatAddress(match.params.contractAddress);

    if(this.path.startsWith("/content-types")) {
      this.libraryId = Fabric.contentSpaceLibraryId;
    }

    this.rootStore.notificationStore.ChangeRoute();

    Fabric.SetFramePath({path: this.path});
  }
}

export default RouterStore;
