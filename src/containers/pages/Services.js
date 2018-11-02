import { connect } from "react-redux";
import Services from "../../components/pages/Services";

const mapStateToProps = state => ({
  state: state,
});

const mapDispatchToProps = dispatch => ({
});

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Services);