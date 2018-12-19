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
  WithdrawContractFunds,
  GetContractBalance,
  DeployContract,
  ListDeployedContracts,
  RemoveDeployedContract,
  WatchContract
} from "../../actions/Contracts";
import CompileContractForm from "../../components/pages/contracts/CompileContractForm";
import ContractForm from "../../components/pages/contracts/ContractForm";
import Contracts from "../../components/pages/contracts/Contracts";
import Contract from "../../components/pages/contracts/Contract";
import DeployContractForm from "../../components/pages/contracts/DeployContractForm";

import { WrapRequest } from "../../actions/Requests";
import {GetContentLibrary, GetContentObject} from "../../actions/Content";
import { SetErrorMessage } from "../../actions/Notifications";
import DeployedContract from "../../components/pages/contracts/deployed/DeployedContract";
import DeployedContractMethodForm from "../../components/pages/contracts/deployed/DeployedContractMethodForm";
import DeployedContractFundsForm from "../../components/pages/contracts/deployed/DeployedContractFundsForm";
import WatchContractForm from "../../components/pages/contracts/WatchContractForm";

const mapStateToProps = (state) => ({
  requests: state.requests,
  ...state.contracts,
  content: state.content,
  accessGroups: state.accessGroups
});

const mapDispatchToProps = dispatch =>
  Thunk(
    dispatch,
    [
      WrapRequest,
      ListContracts,
      ListDeployedContracts,
      RemoveContract,
      RemoveDeployedContract,
      CompileContracts,
      SaveContract,
      DeployContract,
      DeployContentContract,
      SetErrorMessage,
      GetContentObject,
      GetContentLibrary,
      CallContractMethod,
      GetContractEvents,
      SendFunds,
      WithdrawContractFunds,
      GetContractBalance,
      WatchContract
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

export const WatchContractFormContainer = connect(
  mapStateToProps,
  mapDispatchToProps
)(WatchContractForm);

export const DeployContractFormContainer = connect(
  mapStateToProps,
  mapDispatchToProps
)(DeployContractForm);

export const DeployedContractContainer = connect(
  mapStateToProps,
  mapDispatchToProps
)(DeployedContract);

export const DeployedContractMethodFormContainer = connect(
  mapStateToProps,
  mapDispatchToProps
)(DeployedContractMethodForm);

export const DeployedContractFundsFormContainer = connect(
  mapStateToProps,
  mapDispatchToProps
)(DeployedContractFundsForm);
