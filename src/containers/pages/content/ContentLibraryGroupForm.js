import React from "react";
import { connect } from "react-redux";
import Thunk from "../../../utils/Thunk";
import Container from "../../Container";
import ContentLibraryGroupForm from "../../../components/pages/content/ContentLibraryGroupForm";
import {
  GetContentLibrary,
  ListContentLibraryGroupPermissions,
  ListContentLibraryGroups,
  UpdateContentLibraryGroup
} from "../../../actions/Content";
import {ListAccessGroups} from "../../../actions/AccessGroups";

const mapStateToProps = (state, props) => ({
  library: state.content.libraries[props.libraryId || props.match.params.libraryId],
  accessGroups: state.accessGroups.accessGroups
});

const mapDispatchToProps = dispatch =>
  Thunk(
    dispatch,
    [
      GetContentLibrary,
      ListAccessGroups,
      ListContentLibraryGroups,
      ListContentLibraryGroupPermissions,
      UpdateContentLibraryGroup
    ]
  );

const LoadLibrary = async ({props}) => {
  await props.GetContentLibrary({libraryId: props.libraryId});
  await props.ListAccessGroups({params: {}});
  await props.ListContentLibraryGroupPermissions({libraryId: props.libraryId});
};

const Submit = async ({props, params}) => {
  await props.UpdateContentLibraryGroup({libraryId: props.libraryId, ...params});
};

const Component = Container(ContentLibraryGroupForm);
const ContentLibraryGroupFormContainer = (props) => {
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
)(ContentLibraryGroupFormContainer);
