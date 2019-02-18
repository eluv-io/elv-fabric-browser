import React from "react";
import { connect } from "react-redux";
import Thunk from "../../../utils/Thunk";
import Container from "../../Container";
import ContentLibraryGroupsForm from "../../../components/pages/content/ContentLibraryGroupsForm";
import {GetContentLibrary, ListContentLibraryGroups, UpdateContentLibraryGroups} from "../../../actions/Content";
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
      UpdateContentLibraryGroups
    ]
  );

const LoadLibrary = async ({props}) => {
  await props.ListAccessGroups({params: {}});
  await props.GetContentLibrary({libraryId: props.libraryId});
  await props.ListContentLibraryGroups({libraryId: props.libraryId});
};

const Submit = async ({props, params}) => {
  await props.UpdateContentLibraryGroups(params);
};

const Component = Container(ContentLibraryGroupsForm);
const ContentLibraryGroupsFormContainer = (props) => {
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
)(ContentLibraryGroupsFormContainer);
