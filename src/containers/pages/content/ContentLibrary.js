import React from "react";
import { connect } from "react-redux";
import Thunk from "../../../utils/Thunk";
import {
  DeleteContentLibrary,
  GetContentLibrary,
  ListContentLibraryGroups,
  ListContentObjects
} from "../../../actions/Content";
import Container from "../../Container";
import {ListAccessGroups} from "../../../actions/AccessGroups";
import ContentLibrary from "../../../components/pages/content/ContentLibrary";

const mapStateToProps = (state, props) => ({
  library: state.content.libraries[props.libraryId || props.match.params.libraryId],
  accessGroups: state.accessGroups.accessGroups,
  libraries: state.content.libraries,
  objects: state.content.objects,
  count: state.content.count
});

const mapDispatchToProps = dispatch =>
  Thunk(
    dispatch,
    [
      GetContentLibrary,
      ListContentLibraryGroups,
      ListAccessGroups,
      ListContentObjects,
      DeleteContentLibrary
    ]
  );

const LoadLibrary = async ({props}) => {
  await props.GetContentLibrary({libraryId: props.libraryId});
  await props.ListContentLibraryGroups({libraryId: props.libraryId});
  await props.ListAccessGroups({params: {}});
};

const LoadObjects = async ({props, params}) => {
  await props.ListContentObjects(params);
};

const DeleteLibrary = async ({props, params}) => {
  await props.DeleteContentLibrary(params);
};

const Component = Container(ContentLibrary);
const ContentLibrariesContainer = (props) => {
  const libraryId = props.libraryId || props.match.params.libraryId;

  return (
    <Component
      {...props}
      libraryId={libraryId}
      Load={LoadLibrary}
      methods={{
        ListContentObjects: LoadObjects,
        DeleteContentLibrary: DeleteLibrary
      }}
    />
  );
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(ContentLibrariesContainer);
