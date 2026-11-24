import Fabric from "@/client/Fabric";
import {action, computed, flow, makeAutoObservable, observable} from "mobx";
import {FormatAddress} from "@/utils/Helpers";
import {Cancelable} from "@/utils/Cancelable";
import {ParseInputJson} from "@/utils/Helpers";

class GroupStore {
  accessGroups = {};
  accessGroupsCount = 0;

  get contractAddress() {
    return this.rootStore.routerStore.contractAddress;
  }

  get accessGroup() {
    return this.accessGroups[this.contractAddress];
  }

  constructor(rootStore) {
    makeAutoObservable(this);

    this.rootStore = rootStore;
  }

  ListAccessGroups = flow(function * ({params, publicOnly=true}) {
    const {accessGroups, count} = yield Cancelable(
      params.cancelable,
      async () => await Fabric.ListAccessGroups({params, publicOnly})
    );

    if(this.contractAddress) {
      accessGroups[this.contractAddress] = {
        ...(accessGroups?.[this.contractAddress] || {}),
        ...(this.accessGroups?.[this.contractAddress] || {}),
      };
    }

    this.accessGroups = accessGroups;
    this.accessGroupsCount = count;
  });

  AccessGroup = flow(function * ({contractAddress}) {
    this.accessGroups[contractAddress] = yield Fabric.GetAccessGroup({contractAddress});
  });

  AccessGroupGroupPermissions = flow(function * ({contractAddress}) {
    this.accessGroups[contractAddress].groupPermissions = yield Fabric.GetContentObjectGroupPermissions({objectId: Fabric.utils.AddressToObjectId(contractAddress)});
  });

  SaveAccessGroup = flow(function * ({
    name,
    description,
    metadata,
    address,
    oauthEnabled,
    oauthIssuer,
    oauthAud,
    oauthGroups,
    trustAuthorityId
  }) {
    metadata = ParseInputJson(metadata);

    if(address) {
      const objectId = Fabric.utils.AddressToObjectId(address);

      yield Fabric.EditAndFinalizeContentObject({
        libraryId: Fabric.contentSpaceLibraryId,
        objectId,
        commitMessage: "Fabric Browser form",
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
              ...metadata,
              name,
              description,
              public: {
                name,
                description
              }
            }
          });
        }
      });

      if(oauthEnabled) {
        yield Fabric.LinkOAuthGroup({
          address,
          oauthIssuer,
          oauthAud,
          oauthGroups,
          trustAuthorityId
        });
      } else {
        yield Fabric.UnlinkOAuthGroup({address});
      }

      this.rootStore.notificationStore.SetNotificationMessage({
        message: "Access group successfully updated",
        redirect: true
      });
    } else {
      // New access group - deploy contract
      address = yield Fabric.CreateAccessGroup({
        name,
        description,
        metadata
      });

      if(oauthEnabled) {
        yield Fabric.LinkOAuthGroup({
          address,
          oauthIssuer,
          oauthAud,
          oauthGroups,
          trustAuthorityId
        });
      }

      // Automatically add permissions for content admins
      const contentAdminsGroupAddress = yield Fabric.GetContentAdminsGroupAddress();
      yield Fabric.AddContentObjectGroupPermission({
        objectId: Fabric.utils.AddressToObjectId(address),
        groupAddress: contentAdminsGroupAddress,
        permission: "manage"
      });

      this.rootStore.notificationStore.SetNotificationMessage({
        message: "Access group successfully created",
        redirect: true
      });
    }

    return FormatAddress(address);
  });


  RemoveAccessGroup = flow(function * ({address}) {
    yield Fabric.DeleteAccessGroup({address});

    this.rootStore.notificationStore.SetNotificationMessage({
      message: "Access group successfully deleted",
      redirect: true
    });
  });

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

  async IsSameTenant({userAddress}) {
    try {
      const walletAddress = await Fabric.client.userProfileClient.UserWalletAddress({address: userAddress});
      const userTenant = await Fabric.client.TenantContractId({contractAddress: walletAddress});
      const myTenant = await Fabric.client.userProfileClient.TenantContractId();

      return Fabric.utils.EqualHash(userTenant, myTenant);
    } catch(error) {
      // eslint-disable-next-line no-console
      console.log(error);
    }
  }


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


  LeaveAccessGroup = flow(function * ({contractAddress}) {
    const manager = this.accessGroup.isManager;
    const member = (this.accessGroup.members || {}).hasOwnProperty(Fabric.currentAccountAddress);

    yield Fabric.LeaveAccessGroup({
      contractAddress,
      member,
      manager
    });

    this.rootStore.notificationStore.SetNotificationMessage({
      message: "Access group successfully left",
      redirect: true
    });
  });


  SetInheritedGroupAccess = flow(function * () {
    let groupPermission = false;
    for(let i = 0; i < Object.keys(this.accessGroup.groupPermissions || {}).length; i++) {
      let address = Object.keys(this.accessGroup.groupPermissions)[i];

      groupPermission = yield Fabric.IsGroupMember({
        contractAddress: address,
        memberAddress: this.rootStore.currentAccountAddress
      });

      if(groupPermission) {
        break;
      }
    }

    this.accessGroups[this.contractAddress].hasAccess = groupPermission;
  });


  SetGroupVisibility = flow(function * ({visibility}) {
    yield Fabric.SetGroupVisibility({
      contractAddress: this.contractAddress,
      visibility
    });

    this.accessGroups[this.contractAddress].visibility = visibility;
  });
}

export default GroupStore;
