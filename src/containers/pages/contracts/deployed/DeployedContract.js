import React from "react";
import Thunk from "../../../../utils/Thunk";
import Container from "../../../Container";
import {CallContractMethod, GetContractBalance, RemoveDeployedContract} from "../../../../actions/Contracts";
import DeployedContract from "../../../../components/pages/contracts/deployed/DeployedContract";
import ContractInfoContainer from "./ContractInfo";

const mapStateToProps = () => ({});

const mapDispatchToProps = dispatch =>
  Thunk(
    dispatch,
    [
      RemoveDeployedContract,
      CallContractMethod,
      GetContractBalance
    ]
  );

const Delete = async ({props, params}) => {
  await props.RemoveDeployedContract(params);
};

const CallMethod = async ({props, params}) => {
  await props.CallContractMethod(params);
};

const GetBalance = async ({props, params}) => {
  await props.GetContractBalance(params);
};

const Component = Container(DeployedContract);
const DeployedContractContainer = (props) => {
  return (
    <Component
      {...props}
      methods={{
        CallContractMethod: CallMethod,
        GetContractBalance: GetBalance,
        RemoveDeployedContract: Delete
      }}
    />
  );
};

export default ContractInfoContainer(
  DeployedContractContainer,
  mapStateToProps,
  mapDispatchToProps
);
