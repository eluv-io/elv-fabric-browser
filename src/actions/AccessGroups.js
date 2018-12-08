import ActionTypes from "./ActionTypes";
import Fabric from "../clients/Fabric";
import {SetNotificationMessage} from "./Notifications";

export const ListAccessGroups = () => {
  return async (dispatch) => {
    const accessGroups = await Fabric.FabricBrowser.AccessGroups();
    dispatch({
      type: ActionTypes.accessGroups.list,
      accessGroups
    });
  };
};

export const SaveAccessGroup = ({originalName, name, description, address, members}) => {
  return async (dispatch) => {
    if(address) {
      // Existing access group - update attributes
      await Fabric.FabricBrowser.AddAccessGroup({name, description, address, members});

      // If name changed, remove old entry
      if(originalName !== name) { await Fabric.FabricBrowser.RemoveAccessGroup({name: originalName}); }

      dispatch(SetNotificationMessage({
        message: "Access group successfully updated",
        redirect: true
      }));
    } else {
      // New access group - deploy contract
      address = await Fabric.CreateAccessGroup();
      await Fabric.FabricBrowser.AddAccessGroup({name, description, address, members});

      dispatch(SetNotificationMessage({
        message: "Access group successfully created",
        redirect: true
      }));
    }
  };
};

// Determine diff between new and old members and add/remove access as necessary
const UpdateMembers = async ({contractAddress, members, originalMembers}) => {
  const newMembers = Object.values(members).filter(member => !member.manager).map(member => member.address);
  const oldMembers = Object.values(originalMembers).filter(member => !member.manager).map(member => member.address);

  const newManagers = Object.values(members).filter(member => member.manager).map(member => member.address);
  const oldManagers = Object.values(originalMembers).filter(member => member.manager).map(member => member.address);

  const membersToAdd = newMembers.filter(x => !oldMembers.includes(x));
  for(const memberAddress of membersToAdd) {
    await Fabric.AddAccessGroupMember({contractAddress, memberAddress});
  }

  const membersToRemove = oldMembers.filter(x => !newMembers.includes(x));
  for(const memberAddress of membersToRemove) {
    await Fabric.RemoveAccessGroupMember({contractAddress, memberAddress});
  }

  const managersToAdd = newManagers.filter(x => !oldManagers.includes(x));
  for(const memberAddress of managersToAdd) {
    await Fabric.AddAccessGroupManager({contractAddress, memberAddress});
  }

  const managersToRemove = oldManagers.filter(x => !newManagers.includes(x));
  for(const memberAddress of managersToRemove) {
    await Fabric.RemoveAccessGroupManager({contractAddress, memberAddress});
  }
};

export const UpdateAccessGroupMembers = ({name, members, originalMembers}) => {
  return async (dispatch) => {
    const accessGroup = (await Fabric.FabricBrowser.AccessGroups())[name];

    await UpdateMembers({contractAddress: accessGroup.address, members, originalMembers});

    await Fabric.FabricBrowser.AddAccessGroup({
      name,
      creator: accessGroup.creator,
      description: accessGroup.description,
      address: accessGroup.address,
      members
    });

    dispatch(SetNotificationMessage({
      message: "Access group members successfully updated",
      redirect: true
    }));
  };
};

export const RemoveAccessGroup = ({name, contractAddress}) => {
  return async (dispatch) => {
    await Fabric.DeleteAccessGroup({contractAddress});
    await Fabric.FabricBrowser.RemoveAccessGroup({name, contractAddress});

    dispatch(SetNotificationMessage({
      message: "Access group successfully deleted",
      redirect: true
    }));
  };
};
