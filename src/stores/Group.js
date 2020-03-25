import Fabric from "../clients/Fabric";
import {action, computed, flow, observable} from "mobx";
import {FormatAddress} from "../utils/Helpers";
import {Cancelable} from "../utils/Cancelable";
import {ParseInputJson} from "elv-components-js";

class GroupStore {
  @observable accessGroups = {};
  @observable accessGroupsCount = 0;

  @computed get contractAddress() {
    return this.rootStore.routerStore.contractAddress;
  }

  @computed get accessGroup() {
    return this.accessGroups[this.contractAddress];
  }

  constructor(rootStore) {
    this.rootStore = rootStore;
  }

  @action.bound
  ListAccessGroups = flow(function * ({params}) {
    const {accessGroups, count} = yield Cancelable(
      params.cancelable,
      async () => await Fabric.ListAccessGroups({params})
    );

    this.accessGroups = accessGroups;
    this.accessGroupsCount = count;
  });

  @action.bound
  AccessGroup = flow(function * ({contractAddress}) {
    const accessGroup = yield Fabric.GetAccessGroup({contractAddress});

    this.accessGroups[contractAddress] = accessGroup;
  });

  @action.bound
  SaveAccessGroup = flow(function * ({name, description, metadata, address, oauthIssuer, oauthClaims}) {
    metadata = ParseInputJson(metadata);

    if(address) {
      const objectId = Fabric.utils.AddressToObjectId(address);

      yield Fabric.EditAndFinalizeContentObject({
        libraryId: Fabric.contentSpaceLibraryId,
        objectId,
        todo: async (writeToken) => {
          const fullMetadata = await Fabric.GetContentObjectMetadata({
            libraryId: Fabric.contentSpaceLibraryId,
            objectId
          });

          await Fabric.ReplaceMetadata({
            libraryId: Fabric.contentSpaceLibraryId,
            objectId,
            writeToken,
            metadata: {
              ...fullMetadata,
              name,
              description,
              public: {
                name,
                description
              },
              oauthIssuer,
              oauthClaims
            }
          });
        }
      });

      this.rootStore.notificationStore.SetNotificationMessage({
        message: "Access group successfully updated",
        redirect: true
      });
    } else {
      // New access group - deploy contract
      address = yield Fabric.CreateAccessGroup({
        name,
        description,
        metadata: {
          ...metadata,
          oauthIssuer,
          oauthClaims
        }
      });

      this.rootStore.notificationStore.SetNotificationMessage({
        message: "Access group successfully created",
        redirect: true
      });
    }

    return FormatAddress(address);
  });

  @action.bound
  RemoveAccessGroup = flow(function * ({address}) {
    yield Fabric.DeleteAccessGroup({address});

    this.rootStore.notificationStore.SetNotificationMessage({
      message: "Access group successfully deleted",
      redirect: true
    });
  });

  @action.bound
  ListAccessGroupMembers = flow(function * ({contractAddress, showManagers=false, params}) {
    const {members, count} = yield Fabric.ListAccessGroupMembers({contractAddress, showManagers, params});

    if(showManagers) {
      this.accessGroups[contractAddress].managers = members;
      this.accessGroups[contractAddress].managersCount = count;
    } else {
      this.accessGroups[contractAddress].members = members;
      this.accessGroups[contractAddress].membersCount = count;
    }
  });

  @action.bound
  AddAccessGroupMember = flow(function * ({contractAddress, memberAddress, manager=false}) {
    if(manager) {
      yield Fabric.AddAccessGroupManager({contractAddress, memberAddress});
    } else {
      yield Fabric.AddAccessGroupMember({contractAddress, memberAddress});
    }

    this.rootStore.notificationStore.SetNotificationMessage({
      message: `${manager ? "Manager" : "Member"} successfully added`,
      redirect: true
    });
  });

  @action.bound
  RemoveAccessGroupMember = flow(function * ({contractAddress, memberAddress, manager=false}) {
    if(manager) {
      yield Fabric.RemoveAccessGroupManager({contractAddress, memberAddress});
    } else {
      yield Fabric.RemoveAccessGroupMember({contractAddress, memberAddress});
    }

    this.rootStore.notificationStore.SetNotificationMessage({
      message: `${manager ? "Manager" : "Member"} successfully removed`,
      redirect: false
    });
  });

  @action.bound
  LeaveAccessGroup = flow(function * ({contractAddress}) {
    yield Fabric.LeaveAccessGroup({contractAddress});

    this.rootStore.notificationStore.SetNotificationMessage({
      message: "Access group successfully left",
      redirect: true
    });
  });
}

export default GroupStore;
