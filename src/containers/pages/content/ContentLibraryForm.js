import React from "react";
import { connect } from "react-redux";
import Thunk from "../../../utils/Thunk";
import {
  CreateContentLibrary,
  GetContentLibrary,
  UpdateContentLibrary,
} from "../../../actions/Content";
import Container from "../../Container";
import ContentLibraryForm from "../../../components/pages/content/ContentLibraryForm";

const mapStateToProps = (state, props) => ({
  library: state.content.libraries[props.libraryId || props.match.params.libraryId]
});

const mapDispatchToProps = dispatch =>
  Thunk(
    dispatch,
    [
      GetContentLibrary,
      CreateContentLibrary,
      UpdateContentLibrary
    ]
  );

const LoadLibrary = async ({props}) => {
  if(!props.createForm) {
    await props.GetContentLibrary({libraryId: props.libraryId});
  }
};

const Submit = async ({props, params}) => {
  if(props.createForm) {
    return await props.CreateContentLibrary(params);
  } else {
    return await props.UpdateContentLibrary(params);
  }
};

const Component = Container(ContentLibraryForm);
const ContentLibraryFormContainer = (props) => {
  const libraryId = props.libraryId || props.match.params.libraryId;
  const createForm = props.location.pathname.endsWith("create");

  return (
    <Component
      {...props}
      libraryId={libraryId}
      createForm={createForm}
      Load={LoadLibrary}
      methods={{
        Submit: Submit
      }}
    />
  );
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(ContentLibraryFormContainer);
