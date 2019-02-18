import React from "react";
import { connect } from "react-redux";
import Thunk from "../../../utils/Thunk";
import Container from "../../Container";
import {ListContracts, RemoveContract} from "../../../actions/Contracts";
import Contract from "../../../components/pages/contracts/Contract";

const mapStateToProps = (state, props) => ({
  contract: state.contracts.contracts[props.match.params.contractName],
});

const mapDispatchToProps = dispatch =>
  Thunk(
    dispatch,
    [
      ListContracts,
      RemoveContract
    ]
  );

const LoadContracts = async ({props}) => {
  await props.ListContracts({params: {paginate: false}});
};

const Delete = async ({props, params}) => {
  await props.RemoveContract(params);
};

const Component = Container(Contract);
const ContractContainer = (props) => {
  const contractName = props.match.params.contractName;

  return (
    <Component
      {...props}
      contractName={contractName}
      Load={LoadContracts}
      methods={{
        RemoveContract: Delete
      }}
    />
  );
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(ContractContainer);
