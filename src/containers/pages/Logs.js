import React from "react";
import { connect } from "react-redux";
import Thunk from "../../utils/Thunk";
import Container from "../Container";
import Logs from "../../components/pages/logs/Logs";
import {ClearBlockchainEvents, GetBlockchainEvents, GetBlockNumber} from "../../actions/Contracts";

const mapStateToProps = (state) => ({
  logs: state.logs
});

const mapDispatchToProps = dispatch =>
  Thunk(
    dispatch,
    [
      GetBlockchainEvents,
      ClearBlockchainEvents,
    ]
  );

const Events = async ({props, params}) => {
  await props.GetBlockchainEvents(params);
};

const Clear = async ({props, params}) => {
  await props.ClearBlockchainEvents(params);
};

const Component = Container(Logs);
const LogsContainer = (props) => {
  return (
    <Component
      {...props}
      GetBlockNumber={GetBlockNumber}
      methods={{
        GetBlockchainEvents: Events,
        ClearBlockchainEvents: Clear
      }}
    />
  );
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(LogsContainer);
