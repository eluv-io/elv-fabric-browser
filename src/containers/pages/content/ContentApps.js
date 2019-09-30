import React from "react";
import { connect } from "react-redux";
import Thunk from "../../../utils/Thunk";
import {
  AddApp,
  GetContentLibrary,
  GetContentObject,
  RemoveApp
} from "../../../actions/Content";
import Container from "../../Container";
import ContentApps from "../../../components/pages/content/ContentApps";

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
      AddApp,
      RemoveApp
    ]
  );

const LoadObject = async ({props}) => {
  await props.GetContentLibrary({libraryId: props.libraryId});
  await props.GetContentObject({libraryId: props.libraryId, objectId: props.objectId});
};

const Submit = async ({props, params}) => {
  await props.AddApp(params);
};

const Remove = async ({props, params}) => {
  await props.RemoveApp(params);
};

const Component = Container(ContentApps);
const ContentAppsContainer = (props) => {
  const libraryId = props.libraryId || props.match.params.libraryId;
  const objectId = props.match.params.objectId;

  return (
    <Component
      {...props}
      libraryId={libraryId}
      objectId={objectId}
      Load={LoadObject}
      methods={{
        Submit: Submit,
        RemoveApp: Remove
      }}
    />
  );
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(ContentAppsContainer);
