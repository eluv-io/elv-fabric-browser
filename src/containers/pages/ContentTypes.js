import { connect } from "react-redux";
import Thunk from "../../utils/Thunk";
import { ListContentLibraries } from "../../actions/Content";
import ContentLibraries from "../../components/pages/content/ContentLibraries";

const mapStateToProps = (state) => ({
  requests: state.requests,
  contentTypes: state.contentTypes.contentTypes
});

const mapDispatchToProps = dispatch =>
  Thunk(dispatch, [ ListContentLibraries ]);

export const ContentTypesContainer = connect(
  mapStateToProps,
  mapDispatchToProps
)(ContentLibraries);
