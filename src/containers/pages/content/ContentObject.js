import React from "react";
import { connect } from "react-redux";
import Thunk from "../../../utils/Thunk";
import {
  DeleteContentObject,
  DeleteContentVersion,
  DownloadFile,
  DownloadPart,
  FileUrl,
  GetContentLibrary,
  GetContentObject,
  GetContentObjectPermissions,
  GetContentObjectVersions,
  ListContentLibraryGroups,
  PublishContentObject,
  UploadFiles
} from "../../../actions/Content";
import Container from "../../Container";
import ContentObject from "../../../components/pages/content/ContentObject";
import Fabric from "../../../clients/Fabric";

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
      GetContentObjectVersions,
      ListContentLibraryGroups,
      GetContentObjectPermissions,
      DeleteContentVersion,
      DeleteContentObject,
      DownloadPart,
      DownloadFile,
      UploadFiles,
      FileUrl,
      PublishContentObject
    ]
  );

const LoadObject = async ({props}) => {
  const libraryId = props.libraryId;
  const objectId = props.objectId;

  await props.GetContentLibrary({libraryId});
  await props.GetContentObject({libraryId, objectId});
  await props.GetContentObjectVersions({libraryId, objectId});

  const isContentLibraryObject = Fabric.utils.EqualHash(libraryId, objectId);
  const isContentType = libraryId === Fabric.contentSpaceLibraryId && !isContentLibraryObject;
  const isNormalObject = !isContentLibraryObject && !isContentType;

  if(isNormalObject) {
    await props.ListContentLibraryGroups({libraryId});
    await props.GetContentObjectPermissions({libraryId, objectId});
  }
};

const Publish = async ({props, params}) => {
  await props.PublishContentObject(params);
};

const Upload = async ({props, params}) => {
  await props.UploadFiles(params);
};

const DeleteVersion = async ({props, params}) => {
  await props.DeleteContentVersion(params);
};

const Delete = async ({props, params}) => {
  await props.DeleteContentObject(params);
};

const Component = Container(ContentObject);
const ContentObjectContainer = (props) => {
  const libraryId = props.libraryId || props.match.params.libraryId;
  const objectId = props.match.params.objectId;

  return (
    <Component
      {...props}
      libraryId={libraryId}
      objectId={objectId}
      Load={LoadObject}
      methods={{
        PublishContentObject: Publish,
        UploadFiles: Upload,
        DeleteContentVersion: DeleteVersion,
        DeleteContentObject: Delete
      }}
    />
  );
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(ContentObjectContainer);
