import React from "react";
import { connect } from "react-redux";
import Thunk from "../../../utils/Thunk";
import Container from "../../Container";
import {ListContracts, SaveContract} from "../../../actions/Contracts";
import ContractForm from "../../../components/pages/contracts/ContractForm";
import {SetErrorMessage} from "../../../actions/Notifications";

const mapStateToProps = (state, props) => ({
  contract: props.match.params.contractName ? state.contracts.contracts[props.match.params.contractName] : undefined,
  contracts: state.contracts.contracts,
  contractData: state.contracts.contractData
});

const mapDispatchToProps = dispatch =>
  Thunk(
    dispatch,
    [
      ListContracts,
      SaveContract,
      SetErrorMessage
    ]
  );

const LoadContracts = async ({props}) => {
  await props.ListContracts({params: {paginate: false}});
};

const Submit = async ({props, params}) => {
  await props.SaveContract(params);
};

const Component = Container(ContractForm);
const ContractFormContainer = (props) => {
  const createForm = !props.location.pathname.endsWith("edit");
  const contractName = props.match.params.contractName;

  return (
    <Component
      {...props}
      createForm={createForm}
      contractName={contractName}
      Load={LoadContracts}
      methods={{
        Submit: Submit
      }}
    />
  );
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(ContractFormContainer);
