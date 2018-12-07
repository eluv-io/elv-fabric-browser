import ActionTypes from "../actions/ActionTypes";

const AccountsReducer = (state = {}, action) => {
  switch (action.type) {
    case ActionTypes.request.accounts.completed.list.currentAccountAddress:
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
