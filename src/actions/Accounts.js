import ActionTypes from "./ActionTypes";
import Fabric from "../clients/Fabric";

export const SetCurrentAccount = () => {
  return async (dispatch) => {
    const currentAccountAddress = await Fabric.CurrentAccountAddress();
    dispatch({
      type: ActionTypes.request.accounts.completed.list.currentAccountAddress,
      address: currentAccountAddress.toLowerCase()
    });
  };
};



