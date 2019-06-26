import ActionTypes from "../actions/ActionTypes";

const AccountsReducer = (state = {}, action) => {
  switch(action.type) {
    case ActionTypes.accounts.get.currentAccountAddress:
      return {
        ...state,
        currentAccountAddress: action.address
      };

    default:
      return {
        ...state,
        currentAccountAddress: state.currentAccountAddress
      };
  }
};

export default AccountsReducer;
