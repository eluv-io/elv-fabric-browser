import React from "react";
import { connect } from "react-redux";
import Thunk from "../../../utils/Thunk";
import {
  CreateFromContentTypeSchema, GetContentLibrary,
  GetContentObject,
  ContentTypes,
  ListLibraryContentTypes,
  UpdateFromContentTypeSchema,
} from "../../../actions/Content";
import Container from "../../Container";
import ContentObjectForm from "../../../components/pages/content/ContentObjectForm";

const mapStateToProps = (state, props) => ({
  library: state.content.libraries[props.libraryId || props.match.params.libraryId],
  object: state.content.objects[props.match.params.objectId],
  types: state.content.availableTypes
});

const mapDispatchToProps = dispatch =>
  Thunk(
    dispatch,
    [
      GetContentLibrary,
      CreateFromContentTypeSchema,
      UpdateFromContentTypeSchema,
      GetContentObject,
      ContentTypes,
      ListLibraryContentTypes
    ]
  );

const LoadObject = async ({props}) => {
  await props.GetContentLibrary({libraryId: props.libraryId});

  if(props.createForm) {
    await props.ContentTypes();
  } else {
    await props.GetContentObject({
      libraryId: props.libraryId,
      objectId: props.objectId
    });
  }
};

const Submit = async ({props, params}) => {
  if(props.createForm) {
    return await props.CreateFromContentTypeSchema(params);
  } else {
    return await props.UpdateFromContentTypeSchema(params);
  }
};

const Component = Container(ContentObjectForm);
const ContentObjectFormContainer = (props) => {
  const libraryId = props.libraryId || props.match.params.libraryId;
  const objectId = props.match.params.objectId;
  const createForm = props.location.pathname.endsWith("create");

  return (
    <Component
      {...props}
      libraryId={libraryId}
      objectId={objectId}
      createForm={createForm}
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
)(ContentObjectFormContainer);
