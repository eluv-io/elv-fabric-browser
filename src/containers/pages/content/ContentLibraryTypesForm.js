import React from "react";
import { connect } from "react-redux";
import Thunk from "../../../utils/Thunk";
import Container from "../../Container";
import {
  GetContentLibrary,
  ContentTypes,
  SetLibraryContentTypes,
} from "../../../actions/Content";
import ContentLibraryTypesForm from "../../../components/pages/content/ContentLibraryTypesForm";

const mapStateToProps = (state, props) => ({
  library: state.content.libraries[props.libraryId || props.match.params.libraryId],
  types: state.content.allTypes
});

const mapDispatchToProps = dispatch =>
  Thunk(
    dispatch,
    [
      GetContentLibrary,
      ContentTypes,
      SetLibraryContentTypes
    ]
  );

const LoadLibrary = async ({props}) => {
  await props.GetContentLibrary({libraryId: props.libraryId});
  await props.ContentTypes();
};

const Submit = async ({props, params}) => {
  await props.SetLibraryContentTypes(params);
};

const Component = Container(ContentLibraryTypesForm);
const ContentLibraryTypesFormContainer = (props) => {
  const libraryId = props.libraryId || props.match.params.libraryId;

  return (
    <Component
      {...props}
      libraryId={libraryId}
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
)(ContentLibraryTypesFormContainer);
