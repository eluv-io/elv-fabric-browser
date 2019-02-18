import React from "react";
import Thunk from "../../../../utils/Thunk";
import Container from "../../../Container";
import {
  GetContractBalance,
  SendFunds,
  WithdrawContractFunds
} from "../../../../actions/Contracts";
import ContractInfoContainer from "./ContractInfo";
import DeployedContractFundsForm from "../../../../components/pages/contracts/deployed/DeployedContractFundsForm";

const mapStateToProps = () => ({});

const mapDispatchToProps = dispatch =>
  Thunk(
    dispatch,
    [
      SendFunds,
      WithdrawContractFunds,
      GetContractBalance
    ]
  );

const Send = async ({props, params}) => {
  await props.SendFunds(params);
};

const Withdraw = async ({props, params}) => {
  await props.WithdrawContractFunds(params);
};

const GetBalance = async ({props, params}) => {
  await props.GetContractBalance(params);
};

const Component = Container(DeployedContractFundsForm);
const DeployedContractFundsFormContainer = (props) => {
  return (
    <Component
      {...props}
      methods={{
        SendFunds: Send,
        WithdrawContractFunds: Withdraw,
        GetContractBalance: GetBalance
      }}
    />
  );
};

export default ContractInfoContainer(
  DeployedContractFundsFormContainer,
  mapStateToProps,
  mapDispatchToProps
);
