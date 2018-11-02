import ActionTypes from "../actions/ActionTypes";

const AccountsReducer = (state = {}, action) => {
  switch (action.type) {
    case ActionTypes.request.accounts.completed.list.accounts:
      return {
        ...state,
        accounts: {
          ...state.accounts,
          ...action.accounts
        }
      };

    case ActionTypes.request.accounts.completed.list.account:
      return {
        ...state,
        accountInfo: {
          ...state.accountInfo,
          [action.accountAddress]: action.accountInfo
        }
      };


    default:
      return {
        ...state,
        accounts: state.accounts || {},
        accountInfo: state.accountInfo || {}
      };
  }
};

export default AccountsReducer;
