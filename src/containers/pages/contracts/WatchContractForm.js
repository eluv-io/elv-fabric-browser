import React from "react";
import { connect } from "react-redux";
import Thunk from "../../../utils/Thunk";
import Container from "../../Container";
import {WatchContract} from "../../../actions/Contracts";
import WatchContractForm from "../../../components/pages/contracts/WatchContractForm";

const mapStateToProps = () => ({});

const mapDispatchToProps = dispatch =>
  Thunk(
    dispatch,
    [
      WatchContract
    ]
  );

const Submit = async ({props, params}) => {
  await props.WatchContract(params);
};

const Component = Container(WatchContractForm);
const WatchContractFormContainer = (props) => {
  const createForm = !props.location.pathname.endsWith("edit");
  const contractName = props.match.params.contractName;

  return (
    <Component
      {...props}
      createForm={createForm}
      contractName={contractName}
      methods={{
        Submit: Submit
      }}
    />
  );
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(WatchContractFormContainer);
