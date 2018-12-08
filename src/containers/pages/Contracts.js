import { connect } from "react-redux";
import Thunk from "../../utils/Thunk";
import {
  ListContracts,
  CompileContracts,
  DeployContentContract,
  SaveContract,
  RemoveContract,
  CallContractMethod,
  GetContractEvents,
  SendFunds,
  WithdrawContractFunds, GetContractBalance
} from "../../actions/Contracts";
import CompileContractForm from "../../components/pages/contracts/CompileContractForm";
import DeployContractForm from "../../components/pages/contracts/DeployContractForm";
import { SetErrorMessage } from "../../actions/Notifications";
import ContractForm from "../../components/pages/contracts/ContractForm";
import Contracts from "../../components/pages/contracts/Contracts";
import Contract from "../../components/pages/contracts/Contract";
import ContentContract from "../../components/pages/content/contracts/ContentContract";
import ContentContractMethodForm from "../../components/pages/content/contracts/ContentContractMethodForm";
import { GetContentObject } from "../../actions/Content";
import ContentContractFundsForm from "../../components/pages/content/contracts/ContentContractFundsForm";
import { WrapRequest } from "../../actions/Requests";

const mapStateToProps = (state) => ({
  requests: state.requests,
  ...state.contracts,
  content: state.content
});

const mapDispatchToProps = dispatch =>
  Thunk(
    dispatch,
    [
      WrapRequest,
      ListContracts,
      RemoveContract,
      CompileContracts,
      SaveContract,
      DeployContentContract,
      SetErrorMessage,
      GetContentObject,
      CallContractMethod,
      GetContractEvents,
      SendFunds,
      WithdrawContractFunds,
      GetContractBalance
    ]
  );

export const ContractsContainer = connect(
  mapStateToProps,
  mapDispatchToProps
)(Contracts);

export const ContractContainer = connect(
  mapStateToProps,
  mapDispatchToProps
)(Contract);

export const CompileContractFormContainer = connect(
  mapStateToProps,
  mapDispatchToProps
)(CompileContractForm);

export const ContractFormContainer = connect(
  mapStateToProps,
  mapDispatchToProps
)(ContractForm);

export const DeployContentContractFormContainer = connect(
  mapStateToProps,
  mapDispatchToProps
)(DeployContractForm);

export const ContentContractContainer = connect(
  mapStateToProps,
  mapDispatchToProps
)(ContentContract);

export const ContentContractFundsFormContainer = connect(
  mapStateToProps,
  mapDispatchToProps
)(ContentContractFundsForm);

export const ContentContractMethodFormContainer = connect(
  mapStateToProps,
  mapDispatchToProps
)(ContentContractMethodForm);

