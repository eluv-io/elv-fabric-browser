import React from "react";
import { connect } from "react-redux";
import Thunk from "../../../utils/Thunk";
import Container from "../../Container";
import {CompileContracts, SaveContract} from "../../../actions/Contracts";
import CompileContractForm from "../../../components/pages/contracts/CompileContractForm";

const mapStateToProps = (state) => ({
  contractData: state.contracts.contractData,
  errors: state.contracts.errors
});

const mapDispatchToProps = dispatch =>
  Thunk(
    dispatch,
    [
      SaveContract,
      CompileContracts
    ]
  );

const Compile = async ({props, params}) => {
  await props.CompileContracts(params);
};

const Submit = async ({props, params}) => {
  await props.SaveContract(params);
};

const Component = Container(CompileContractForm);
const CompileContractFormContainer = (props) => {
  return (
    <Component
      {...props}
      methods={{
        Submit: Submit,
        CompileContracts: Compile
      }}
    />
  );
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(CompileContractFormContainer);
