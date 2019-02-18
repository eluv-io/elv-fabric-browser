import React from "react";
import { connect } from "react-redux";
import Thunk from "../../../utils/Thunk";
import Container from "../../Container";
import {ListContracts, ListDeployedContracts} from "../../../actions/Contracts";
import Contracts from "../../../components/pages/contracts/Contracts";

const mapStateToProps = (state) => ({
  contracts: state.contracts.contracts,
  deployedContracts: state.contracts.deployedContracts,
  count: state.contracts.count
});

const mapDispatchToProps = dispatch =>
  Thunk(
    dispatch,
    [
      ListContracts,
      ListDeployedContracts
    ]
  );

const LoadContracts = async ({props, params}) => {
  await props.ListContracts(params);
};

const LoadDeployedContracts = async ({props, params}) => {
  await props.ListDeployedContracts(params);
};

const Component = Container(Contracts);
const ContractsContainer = (props) => {
  return (
    <Component
      {...props}
      methods={{
        ListContracts: LoadContracts,
        ListDeployedContracts: LoadDeployedContracts
      }}
    />
  );
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(ContractsContainer);
