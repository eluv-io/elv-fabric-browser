import {observable, action, makeAutoObservable} from "mobx";
import {FormatAddress} from "@/utils/Helpers";
import UrlJoin from "url-join";
import Fabric from "@/client/Fabric";

class RouterStore {
  path;

  libraryId;
  objectId;
  contractAddress;

  constructor(rootStore) {
    makeAutoObservable(this);

    this.rootStore = rootStore;
  }

  UpdateRoute({path, params}) {
    this.path = path;
    this.libraryId = params.libraryId;
    this.objectId = params.objectId;
    this.contractName = params.contractName;
    this.contractAddress = FormatAddress(params.contractAddress);

    if(this.path.startsWith("/content-types")) {
      this.libraryId = Fabric.contentSpaceLibraryId;
    }

    this.rootStore.notificationStore.ChangeRoute();

    Fabric.SetFramePath({path: UrlJoin("/", this.path)});
  }
}

export default RouterStore;
