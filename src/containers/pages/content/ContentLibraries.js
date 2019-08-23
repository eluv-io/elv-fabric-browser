import React from "react";
import { connect } from "react-redux";
import Thunk from "../../../utils/Thunk";
import {
  ListContentLibraries
} from "../../../actions/Content";
import ContentLibraries from "../../../components/pages/content/ContentLibraries";
import Container from "../../Container";

const mapStateToProps = (state) => ({
  libraries: state.content.libraries,
  count: state.content.count
});

const mapDispatchToProps = dispatch =>
  Thunk(
    dispatch,
    [
      ListContentLibraries,
    ]
  );

const LoadLibraries = async ({props, params}) => {
  await props.ListContentLibraries(params);
};

const Component = Container(ContentLibraries);
const ContentLibrariesContainer = (props) => {
  return (
    <Component
      {...props}
      methods={{
        ListContentLibraries: LoadLibraries
      }}
    />
  );
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(ContentLibrariesContainer);
