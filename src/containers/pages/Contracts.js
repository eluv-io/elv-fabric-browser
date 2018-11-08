import { connect } from "react-redux";
import Thunk from "../../utils/Thunk";
import {
  ListContracts,
  CompileContracts,
  DeployContentContract,
  SaveContract,
  RemoveContract
} from "../../actions/Contracts";
import CompileContractForm from "../../components/pages/contracts/CompileContractForm";
import DeployContractForm from "../../components/pages/contracts/DeployContractForm";
import { SetErrorMessage } from "../../actions/Notifications";
import ContractForm from "../../components/pages/contracts/ContractForm";
import Contracts from "../../components/pages/contracts/Contracts";

const mapStateToProps = (state) => ({
  requests: state.requests.contracts,
  contracts: state.contracts,
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
      SetErrorMessage
    ]
  );

export const ContractsContainer = connect(
  mapStateToProps,
  mapDispatchToProps
)(Contracts);

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


