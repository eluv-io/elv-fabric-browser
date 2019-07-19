import ActionTypes from "./ActionTypes";
import Fabric from "../clients/Fabric";
import {SetNotificationMessage} from "./Notifications";
import { FormatAddress } from "../utils/Helpers";
import {WithCancel} from "../utils/Cancelable";

export const ListAccessGroups = ({params}) => {
  return async (dispatch) => {
    const {accessGroups, count} = await WithCancel(
      params.cancelable,
      async () => await Fabric.AccessGroups({params})
    );

    dispatch({
      type: ActionTypes.accessGroups.list,
      accessGroups,
      count
    });
  };
};

export const GetAccessGroup = ({contractAddress}) => {
  return async (dispatch) => {
    const accessGroup = await Fabric.GetAccessGroup({contractAddress});

    dispatch({
      type: ActionTypes.accessGroups.get,
      contractAddress,
      accessGroup
    });
  };
};

export const SaveAccessGroup = ({address}) => {
  return async (dispatch) => {
    if(address) {
      dispatch(SetNotificationMessage({
        message: "Access group successfully updated",
        redirect: true
      }));
    } else {
      // New access group - deploy contract
      address = await Fabric.CreateAccessGroup();

      dispatch(SetNotificationMessage({
        message: "Access group successfully created",
        redirect: true
      }));
    }

    return FormatAddress(address);
  };
};

export const ListAccessGroupMembers = ({contractAddress, params}) => {
  return async (dispatch) => {
    const {members, count} = await WithCancel(
      params.cancelable,
      async () => await Fabric.AccessGroupMembers({contractAddress, params})
    );

    dispatch({
      type: ActionTypes.accessGroups.members.list,
      contractAddress,
      members,
      count
    });
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

export const UpdateAccessGroupMembers = ({address, members, originalMembers}) => {
  return async (dispatch) => {
    const accessGroup = await Fabric.GetAccessGroup({contractAddress: address});

    if(!accessGroup) { throw Error("Access group not found"); }

    await UpdateMembers({contractAddress: address, members, originalMembers});


    dispatch(SetNotificationMessage({
      message: "Access group members successfully updated",
      redirect: true
    }));
  };
};

export const RemoveAccessGroup = ({address}) => {
  return async (dispatch) => {
    await Fabric.DeleteAccessGroup({address});

    dispatch(SetNotificationMessage({
      message: "Access group successfully deleted",
      redirect: true
    }));
  };
};
