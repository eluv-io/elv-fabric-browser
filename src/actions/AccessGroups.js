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

export const SaveAccessGroup = ({name, description, address}) => {
  return async (dispatch) => {
    if(address) {
      const objectId = Fabric.utils.AddressToObjectId(address);
      await Fabric.EditAndFinalizeContentObject({
        libraryId: Fabric.contentSpaceLibraryId,
        objectId,
        todo: async (writeToken) => {
          await Fabric.MergeMetadata({
            libraryId: Fabric.contentSpaceLibraryId,
            objectId,
            writeToken,
            metadata: {
              name,
              description
            }
          });
        }
      });

      dispatch(SetNotificationMessage({
        message: "Access group successfully updated",
        redirect: true
      }));
    } else {
      // New access group - deploy contract
      address = await Fabric.CreateAccessGroup({name, metadata: { description }});

      dispatch(SetNotificationMessage({
        message: "Access group successfully created",
        redirect: true
      }));
    }

    return FormatAddress(address);
  };
};

export const ListAccessGroupMembers = ({contractAddress, showManagers=false, params}) => {
  return async (dispatch) => {
    const {members, count} = await WithCancel(
      params.cancelable,
      async () => await Fabric.ListAccessGroupMembers({contractAddress, showManagers, params})
    );

    dispatch({
      type: ActionTypes.accessGroups.members.list,
      contractAddress,
      members,
      count
    });
  };
};

export const AddAccessGroupMember = ({contractAddress, memberAddress, manager=false}) => {
  return async (dispatch) => {
    if(manager) {
      await Fabric.AddAccessGroupManager({contractAddress, memberAddress});
    } else {
      await Fabric.AddAccessGroupMember({contractAddress, memberAddress});
    }

    dispatch(SetNotificationMessage({
      message: `${manager ? "Manager" : "Member"} successfully added`,
      redirect: false
    }));
  };
};

export const RemoveAccessGroupMember = ({contractAddress, memberAddress, manager=false}) => {
  return async (dispatch) => {
    if(manager) {
      await Fabric.RemoveAccessGroupManager({contractAddress, memberAddress});
    } else {
      await Fabric.RemoveAccessGroupMember({contractAddress, memberAddress});
    }

    dispatch(SetNotificationMessage({
      message: `${manager ? "Manager" : "Member"} successfully removed`,
      redirect: false
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
