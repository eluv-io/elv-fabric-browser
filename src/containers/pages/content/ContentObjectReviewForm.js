import React from "react";
import { connect } from "react-redux";
import Thunk from "../../../utils/Thunk";
import {
  GetContentObject,
  ReviewContentObject,
} from "../../../actions/Content";
import Container from "../../Container";
import ContentObjectReviewForm from "../../../components/pages/content/ContentObjectReviewForm";

const mapStateToProps = (state, props) => ({
  object: state.content.objects[props.match.params.objectId]
});

const mapDispatchToProps = dispatch =>
  Thunk(
    dispatch,
    [
      GetContentObject,
      ReviewContentObject
    ]
  );

const LoadObject = async ({props}) => {
  await props.GetContentObject({libraryId: props.libraryId, objectId: props.objectId});
};

const Submit = async ({props, params}) => {
  await props.ReviewContentObject(params);
};

const Component = Container(ContentObjectReviewForm);
const ContentObjectReviewFormContainer = (props) => {
  const libraryId = props.libraryId || props.match.params.libraryId;
  const objectId = props.match.params.objectId;

  return (
    <Component
      {...props}
      libraryId={libraryId}
      objectId={objectId}
      Load={LoadObject}
      methods={{
        Submit: Submit
      }}
    />
  );
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(ContentObjectReviewFormContainer);
