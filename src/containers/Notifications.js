import { connect } from "react-redux";
import Thunk from "../utils/Thunk";
import Notifications from "../components/Notifications";
import { ClearNotifications } from "../actions/Notifications";

const mapStateToProps = state => ({
  notifications: state.notifications
});

const mapDispatchToProps = dispatch =>
  Thunk(
    dispatch,
    [
      ClearNotifications
    ]
  );

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Notifications);