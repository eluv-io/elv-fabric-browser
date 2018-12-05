import { connect } from "react-redux";
import Thunk from "../utils/Thunk";
import { SetCurrentAccount } from "../actions/Accounts";
import App from "../components/App";

const mapStateToProps = state => ({
  ...state
});

const mapDispatchToProps = dispatch =>
  Thunk(
    dispatch,
    [
      SetCurrentAccount
    ]
  );

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(App);
