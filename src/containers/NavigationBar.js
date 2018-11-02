import { connect } from "react-redux";
import NavigationBar from "../components/NavigationBar";

const mapStateToProps = state => ({
  currentBasePath: state.router.location.pathname.split("/")[1]
});

export default connect(
  mapStateToProps
)(NavigationBar);
