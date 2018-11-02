import { connect } from "react-redux";
import Thunk from "../../utils/Thunk";
import { CompileContracts, DeployContract } from "../../actions/Contracts";
import CompileContractForm from "../../components/pages/contracts/CompileContractForm";
import DeployContractForm from "../../components/pages/contracts/DeployContractForm";
import { SetErrorMessage } from "../../actions/Notifications";

const mapStateToProps = (state) => ({
  requests: state.requests.contracts,
  contracts: state.contracts,
});

const mapDispatchToProps = dispatch =>
  Thunk(
    dispatch,
    [
      CompileContracts,
      DeployContract,
      SetErrorMessage
    ]
  );

export const CompileContractFormContainer = connect(
  mapStateToProps,
  mapDispatchToProps
)(CompileContractForm);

export const DeployContractFormContainer = connect(
  mapStateToProps,
  mapDispatchToProps
)(DeployContractForm);


