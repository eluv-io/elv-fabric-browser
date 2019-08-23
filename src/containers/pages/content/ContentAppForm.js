import React from "react";
import { connect } from "react-redux";
import Thunk from "../../../utils/Thunk";
import {
  AddApp,
  GetContentLibrary,
  GetContentObject
} from "../../../actions/Content";
import Container from "../../Container";
import ContentAppForm from "../../../components/pages/content/ContentAppForm";

const mapStateToProps = (state, props) => ({
  library: state.content.libraries[props.libraryId || props.match.params.libraryId],
  object: state.content.objects[props.match.params.objectId]
});

const mapDispatchToProps = dispatch =>
  Thunk(
    dispatch,
    [
      GetContentLibrary,
      GetContentObject,
      AddApp
    ]
  );

const LoadObject = async ({props}) => {
  await props.GetContentLibrary({libraryId: props.libraryId});
  await props.GetContentObject({libraryId: props.libraryId, objectId: props.objectId});
};

const Submit = async ({props, params}) => {
  await props.AddApp(params);
};

const Component = Container(ContentAppForm);
const ContentAppFormContainer = (props) => {
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
)(ContentAppFormContainer);
