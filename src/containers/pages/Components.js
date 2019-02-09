import { connect } from "react-redux";
import Thunk from "../../utils/Thunk";
import {WrapRequest} from "../../actions/Requests";
import Listing from "../../components/components/Listing";
import RequestElement from "../../components/components/RequestElement";

const mapStateToProps = (state) => ({
  requests: state.requests
});

const mapDispatchToProps = dispatch =>
  Thunk(
    dispatch,
    [
      WrapRequest,
    ]
  );

export const ListingContainer = connect(
  mapStateToProps,
  mapDispatchToProps
)(Listing);

export const RequestElementContainer = connect(
  mapStateToProps,
  mapDispatchToProps
)(RequestElement);
