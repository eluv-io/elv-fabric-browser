import { connect } from "react-redux";
import Thunk from "../../utils/Thunk";
import {ListAccounts, CreateAccount, GetAccountInfo, UpdateAccountInfo} from "../../actions/Accounts";
import Accounts from "../../components/pages/accounts/Accounts";
import AccountForm from "../../components/pages/accounts/AccountForm";
import Account from "../../components/pages/accounts/Account";
import AccountInfoForm from "../../components/pages/accounts/AccountInfoForm";

const mapStateToProps = (state) => ({
  accounts: state.accounts.accounts,
  accountInfo: state.accounts.accountInfo,
  requests: state.requests.accounts
});

const mapDispatchToProps = dispatch =>
  Thunk(
    dispatch,
    [
      ListAccounts,
      CreateAccount,
      GetAccountInfo,
      UpdateAccountInfo
    ]
  );

export const AccountsContainer = connect(
  mapStateToProps,
  mapDispatchToProps
)(Accounts);

export const AccountFormContainer = connect(
  mapStateToProps,
  mapDispatchToProps
)(AccountForm);

export const AccountContainer = connect(
  mapStateToProps,
  mapDispatchToProps
)(Account);

export const AccountInfoFormContainer = connect(
  mapStateToProps,
  mapDispatchToProps
)(AccountInfoForm);
