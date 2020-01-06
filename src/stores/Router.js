import {observable, action} from "mobx";
import {FormatAddress} from "../utils/Helpers";
import UrlJoin from "url-join";
import Fabric from "../clients/Fabric";

class RouterStore {
  @observable path;

  @observable libraryId;
  @observable objectId;
  @observable contractAddress;

  constructor(rootStore) {
    this.rootStore = rootStore;
  }

  @action.bound
  UpdateRoute(match) {
    this.path = match.url;
    this.libraryId = match.params.libraryId;
    this.objectId = match.params.objectId;
    this.contractName = match.params.contractName;
    this.contractAddress = FormatAddress(match.params.contractAddress);

    if(this.path.startsWith("/content-types")) {
      this.libraryId = Fabric.contentSpaceLibraryId;
    }

    this.rootStore.notificationStore.ChangeRoute();

    Fabric.SetFramePath({path: UrlJoin("#", this.path)});
  }
}

export default RouterStore;
