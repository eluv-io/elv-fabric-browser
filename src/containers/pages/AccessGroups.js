import { connect } from "react-redux";
import AccessGroups from "../../components/pages/AccessGroups";

const mapStateToProps = state => ({
  state: state,
});

const mapDispatchToProps = dispatch => ({
});

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(AccessGroups);