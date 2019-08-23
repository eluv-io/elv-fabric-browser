import React from "react";
import Thunk from "../../../../utils/Thunk";
import Container from "../../../Container";
import {
  ClearContractEvents,
  GetBlockNumber,
  GetContractEvents
} from "../../../../actions/Contracts";
import ContractInfoContainer from "./ContractInfo";
import DeployedContractEvents from "../../../../components/pages/contracts/deployed/DeployedContractEvents";

const mapStateToProps = () => ({});

const mapDispatchToProps = dispatch =>
  Thunk(
    dispatch,
    [
      GetContractEvents,
      ClearContractEvents
    ]
  );

const Events = async ({props, params}) => {
  await props.GetContractEvents(params);
};

const Component = Container(DeployedContractEvents);
const DeployedContractEventsContainer = (props) => {
  return (
    <Component
      {...props}
      GetBlockNumber={GetBlockNumber}
      methods={{
        GetContractEvents: Events,
      }}
    />
  );
};

export default ContractInfoContainer(
  DeployedContractEventsContainer,
  mapStateToProps,
  mapDispatchToProps
);
