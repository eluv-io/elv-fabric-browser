import { connect } from "react-redux";
import Thunk from "../../utils/Thunk";
import {
  ListContentLibraries,
  ListContentObjects,
  CreateContentLibrary,
  GetFullContentObject,
  CreateContentObject,
  UpdateContentObject,
  UploadParts,
  DownloadPart,
  GetContentObjectMetadata,
  GetContentLibrary,
  UpdateContentLibrary
} from "../../actions/Content";
import ContentLibraries from "../../components/pages/content/ContentLibraries";
import ContentLibrary from "../../components/pages/content/ContentLibrary";
import ContentObject from "../../components/pages/content/ContentObject";
import ContentLibraryForm from "../../components/pages/content/ContentLibraryForm";
import ContentObjectForm from "../../components/pages/content/ContentObjectForm";
import ContentObjectUploadForm from "../../components/pages/content/UploadForm";
import ContentObjectApp from "../../components/pages/content/ContentApp";

const mapStateToProps = (state) => ({
  requests: state.requests.content,
  contentLibraries: state.content.contentLibraries,
  formattedLibraries: state.content.formattedLibraries,
  contentObjects: state.content.contentObjects,
  contentObjectMetadata: state.content.contentObjectMetadata
});

const mapDispatchToProps = dispatch =>
  Thunk(
    dispatch,
    [
      ListContentLibraries,
      GetContentLibrary,
      UpdateContentLibrary,
      ListContentObjects,
      CreateContentLibrary,
      GetFullContentObject,
      GetContentObjectMetadata,
      CreateContentObject,
      UpdateContentObject,
      UploadParts,
      DownloadPart
    ]
  );

export const ContentLibrariesContainer = connect(
  mapStateToProps,
  mapDispatchToProps
)(ContentLibraries);

export const ContentLibraryFormContainer = connect(
  mapStateToProps,
  mapDispatchToProps
)(ContentLibraryForm);

export const ContentObjectsContainer = connect(
  mapStateToProps,
  mapDispatchToProps
)(ContentLibrary);

export const ContentObjectContainer = connect(
  mapStateToProps,
  mapDispatchToProps
)(ContentObject);

export const ContentObjectFormContainer = connect(
  mapStateToProps,
  mapDispatchToProps
)(ContentObjectForm);

export const ContentObjectUploadFormContainer = connect(
  mapStateToProps,
  mapDispatchToProps
)(ContentObjectUploadForm);

export const ContentObjectAppContainer = connect(
  mapStateToProps,
  mapDispatchToProps
)(ContentObjectApp);
