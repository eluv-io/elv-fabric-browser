import React from "react";
import { connect } from "react-redux";
import Thunk from "../../../utils/Thunk";
import {
  UploadParts,
} from "../../../actions/Content";
import Container from "../../Container";
import ContentObjectPartsForm from "../../../components/pages/content/ContentObjectPartsForm";

const mapStateToProps = () => ({});

const mapDispatchToProps = dispatch =>
  Thunk(
    dispatch,
    [
      UploadParts
    ]
  );

const Submit = async ({props, params}) => {
  await props.UploadParts(params);
};

const Component = Container(ContentObjectPartsForm);
const ContentObjectPartsFormContainer = (props) => {
  const libraryId = props.libraryId || props.match.params.libraryId;
  const objectId = props.match.params.objectId;

  return (
    <Component
      {...props}
      libraryId={libraryId}
      objectId={objectId}
      methods={{
        Submit: Submit
      }}
    />
  );
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(ContentObjectPartsFormContainer);
