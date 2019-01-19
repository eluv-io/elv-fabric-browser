import { connect } from "react-redux";
import Thunk from "../../utils/Thunk";
import {
  ListContentLibraries,
  ListContentObjects,
  CreateContentLibrary,
  CreateContentObject,
  UpdateContentObject,
  UploadParts,
  DownloadPart,
  GetContentLibrary,
  UpdateContentLibrary,
  DeleteContentLibrary,
  DeleteContentObject,
  DeleteContentVersion,
  UpdateContentLibraryGroups,
  ListContentLibraryGroups,
  GetContentObject,
  GetContentObjectVersions,
  CreateContentType,
  ListContentTypes,
  CreateFromContentTypeSchema,
  UpdateFromContentTypeSchema,
  DownloadFile,
  UploadFiles,
  FileUrl,
  SetLibraryContentTypes,
  ListLibraryContentTypes,
  GetContentType
} from "../../actions/Content";
import ContentLibraries from "../../components/pages/content/ContentLibraries";
import ContentLibrary from "../../components/pages/content/ContentLibrary";
import ContentObject from "../../components/pages/content/ContentObject";
import ContentLibraryForm from "../../components/pages/content/ContentLibraryForm";
import ContentObjectUploadForm from "../../components/pages/content/UploadForm";
import ContentObjectApp from "../../components/pages/content/ContentApp";
import ContentLibraryGroupsForm from "../../components/pages/content/ContentLibraryGroupsForm";
import ContentTypeForm from "../../components/pages/content/ContentTypeForm";
import ContentObjectReviewForm from "../../components/pages/content/ContentObjectReviewForm";
import {ListAccessGroups} from "../../actions/AccessGroups";
import {WrapRequest} from "../../actions/Requests";
import ContentObjectForm from "../../components/pages/content/ContentObjectForm";
import ContentLibraryTypesForm from "../../components/pages/content/ContentLibraryTypesForm";

const mapStateToProps = (state) => ({
  requests: state.requests,
  currentAccountAddress: state.accounts.currentAccountAddress,
  accessGroups: state.accessGroups,
  ...state.content
});

const mapDispatchToProps = dispatch =>
  Thunk(
    dispatch,
    [
      WrapRequest,
      ListContentLibraries,
      GetContentLibrary,
      UpdateContentLibrary,
      DeleteContentLibrary,
      SetLibraryContentTypes,
      ListContentObjects,
      GetContentObject,
      GetContentObjectVersions,
      CreateContentLibrary,
      UpdateContentLibraryGroups,
      DeleteContentObject,
      DeleteContentVersion,
      CreateContentObject,
      UpdateContentObject,
      UploadParts,
      DownloadPart,
      ListAccessGroups,
      ListContentLibraryGroups,
      ListLibraryContentTypes,
      CreateContentType,
      ListContentTypes,
      GetContentType,
      CreateFromContentTypeSchema,
      UpdateFromContentTypeSchema,
      DownloadFile,
      UploadFiles,
      FileUrl
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

export const ContentLibraryContainer = connect(
  mapStateToProps,
  mapDispatchToProps
)(ContentLibrary);

export const ContentLibraryGroupsFormContainer = connect(
  mapStateToProps,
  mapDispatchToProps
)(ContentLibraryGroupsForm);

export const ContentLibraryTypesFormContainer = connect(
  mapStateToProps,
  mapDispatchToProps
)(ContentLibraryTypesForm);

export const ContentObjectContainer = connect(
  mapStateToProps,
  mapDispatchToProps
)(ContentObject);

export const ContentObjectFormContainer = connect(
  mapStateToProps,
  mapDispatchToProps
)(ContentObjectForm);

export const ContentObjectReviewFormContainer = connect(
  mapStateToProps,
  mapDispatchToProps
)(ContentObjectReviewForm);

export const ContentTypeFormContainer = connect(
  mapStateToProps,
  mapDispatchToProps
)(ContentTypeForm);

export const ContentObjectUploadFormContainer = connect(
  mapStateToProps,
  mapDispatchToProps
)(ContentObjectUploadForm);

export const ContentObjectAppContainer = connect(
  mapStateToProps,
  mapDispatchToProps
)(ContentObjectApp);
