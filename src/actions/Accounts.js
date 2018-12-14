import ActionTypes from "./ActionTypes";
import Fabric from "../clients/Fabric";
import {FormatAddress} from "../utils/Helpers";

export const SetCurrentAccount = () => {
  return async (dispatch) => {
    const currentAccountAddress = await Fabric.CurrentAccountAddress();
    dispatch({
      type: ActionTypes.accounts.get.currentAccountAddress,
      address: FormatAddress(currentAccountAddress)
    });
  };
};



