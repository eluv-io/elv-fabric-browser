import React from "react";
import { connect } from "react-redux";
import Thunk from "../../../utils/Thunk";
import {
  CreateContentType,
  GetContentObject,
  GetContentObjectVersions,
  UpdateContentType,
} from "../../../actions/Content";
import Container from "../../Container";
import ContentTypeForm from "../../../components/pages/content/ContentTypeForm";

const mapStateToProps = (state, props) => ({
  library: state.content.libraries[props.libraryId || props.match.params.libraryId],
  object: state.content.objects[props.match.params.objectId],
  types: state.content.allTypes
});

const mapDispatchToProps = dispatch =>
  Thunk(
    dispatch,
    [
      GetContentObject,
      GetContentObjectVersions,
      CreateContentType,
      UpdateContentType
    ]
  );

const LoadType = async ({props}) => {
  if(!props.createForm) {
    await props.GetContentObject({libraryId: props.libraryId, objectId: props.objectId});
    await props.GetContentObjectVersions({libraryId: props.libraryId, objectId: props.objectId});
  }
};

const Submit = async ({props, params}) => {
  if(props.createForm) {
    return await props.CreateContentType(params);
  } else {
    return await props.UpdateContentType(params);
  }
};

const Component = Container(ContentTypeForm);
const ContentTypeFormContainer = (props) => {
  const libraryId = props.libraryId;
  const objectId = props.match.params.objectId;
  const createForm = props.location.pathname.endsWith("create");

  return (
    <Component
      {...props}
      libraryId={libraryId}
      objectId={objectId}
      createForm={createForm}
      Load={LoadType}
      methods={{
        Submit: Submit
      }}
    />
  );
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(ContentTypeFormContainer);
