import { connect } from "react-redux";
import Thunk from "../../utils/Thunk";

import {WrapRequest} from "../../actions/Requests";
import Logs from "../../components/pages/logs/Logs";
import {ClearBlockchainEvents, GetBlockchainEvents} from "../../actions/Contracts";

const mapStateToProps = state => ({
  ...state
});

const mapDispatchToProps = dispatch =>
  Thunk(
    dispatch,
    [
      WrapRequest,
      GetBlockchainEvents,
      ClearBlockchainEvents
    ]
  );

export const LogsContainer = connect(
  mapStateToProps,
  mapDispatchToProps
)(Logs);

