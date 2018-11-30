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
  WithdrawContractFunds
} from "../../actions/Contracts";
import CompileContractForm from "../../components/pages/contracts/CompileContractForm";
import DeployContractForm from "../../components/pages/contracts/DeployContractForm";
import { SetErrorMessage } from "../../actions/Notifications";
import ContractForm from "../../components/pages/contracts/ContractForm";
import Contracts from "../../components/pages/contracts/Contracts";
import Contract from "../../components/pages/contracts/Contract";
import ContentContract from "../../components/pages/content/contracts/ContentContract";
import ContentContractMethodForm from "../../components/pages/content/contracts/ContentContractMethodForm";
import {GetContentObjectMetadata} from "../../actions/Content";
import ContentContractFundsForm from "../../components/pages/content/contracts/ContentContractFundsForm";

const mapStateToProps = (state) => ({
  requests: state.requests,
  contracts: state.contracts,
  content: state.content
});

const mapDispatchToProps = dispatch =>
  Thunk(
    dispatch,
    [
      ListContracts,
      RemoveContract,
      CompileContracts,
      SaveContract,
      DeployContentContract,
      SetErrorMessage,
      GetContentObjectMetadata,
      CallContractMethod,
      GetContractEvents,
      SendFunds,
      WithdrawContractFunds
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

