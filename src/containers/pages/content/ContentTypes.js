import React from "react";
import { connect } from "react-redux";
import Thunk from "../../../utils/Thunk";
import {
  ListContentTypes
} from "../../../actions/Content";
import ContentTypes from "../../../components/pages/content/ContentTypes";
import Container from "../../Container";

const mapStateToProps = (state) => ({
  types: state.content.types,
  count: state.content.count.types
});

const mapDispatchToProps = dispatch =>
  Thunk(
    dispatch,
    [
      ListContentTypes,
    ]
  );

const LoadTypes = async ({props, params}) => {
  await props.ListContentTypes(params);
};

const Component = Container(ContentTypes);
const ContentTypeContainer = (props) => {
  return (
    <Component
      {...props}
      methods={{
        ListContentTypes: LoadTypes
      }}
    />
  );
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(ContentTypeContainer);
