import React from "react";
import { connect } from "react-redux";
import Thunk from "../../../utils/Thunk";
import Container from "../../Container";
import {
  DeployContract,
  GetContractBalance,
  ListContracts,
  ListDeployedContracts,
  SetCustomContentContract
} from "../../../actions/Contracts";
import DeployContractForm from "../../../components/pages/contracts/DeployContractForm";

const mapStateToProps = (state) => ({
  contracts: state.contracts.contracts,
  deployedContracts: state.contracts.deployedContracts
});

const mapDispatchToProps = dispatch =>
  Thunk(
    dispatch,
    [
      ListContracts,
      ListDeployedContracts,
      DeployContract,
      SetCustomContentContract,
      GetContractBalance
    ]
  );

const LoadContracts = async ({props}) => {
  await props.ListContracts({params: {paginate: false}});
  await props.ListDeployedContracts({params: {paginate: false}});
};

const SetCustomContract = async ({props, params}) => {
  return await props.SetCustomContentContract(params);
};

const Deploy = async ({props, params}) => {
  return await props.DeployContract(params);
};

const Component = Container(DeployContractForm);
const DeployContractFormContainer = (props) => {
  const libraryId = props.libraryId || props.match.params.libraryId;
  const objectId = props.match.params.objectId;
  const contractName = props.match.params.contractName;

  return (
    <Component
      {...props}
      libraryId={libraryId}
      objectId={objectId}
      contractName={contractName}
      Load={LoadContracts}
      methods={{
        DeployContract: Deploy,
        SetCustomContentContract: SetCustomContract
      }}
    />
  );
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(DeployContractFormContainer);
