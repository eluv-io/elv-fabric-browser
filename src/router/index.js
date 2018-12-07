import React from "react";
import {Route, Switch} from "react-router";

import {
  AccessGroupContainer,
  AccessGroupFormContainer,
  AccessGroupMembersFormContainer,
  AccessGroupsContainer
} from "../containers/pages/AccessGroups";

import {
  ContentLibrariesContainer,
  ContentLibraryFormContainer,
  ContentLibraryContainer,
  ContentObjectContainer,
  ContentObjectFormContainer,
  ContentObjectUploadFormContainer,
  ContentObjectAppContainer,
  ContentLibraryGroupsFormContainer,
} from "../containers/pages/Content";

import {
  CompileContractFormContainer,
  ContractContainer,
  ContractFormContainer,
  ContractsContainer,
  DeployContentContractFormContainer,
  ContentContractContainer,
  ContentContractMethodFormContainer,
  ContentContractFundsFormContainer
} from "../containers/pages/Contracts";
import Fabric from "../clients/Fabric";
import ErrorHandler from "./ErrorHandler";

function Routes(){
  return (
    <div className="main-content-container">
      <Switch>
        <Route exact path="/" component={ContentLibrariesContainer} />

        <Route exact path="/access-groups" component={AccessGroupsContainer} />
        <Route exact path="/access-groups/create" component={AccessGroupFormContainer} />
        <Route exact path="/access-groups/:accessGroupName" component={AccessGroupContainer} />
        <Route exact path="/access-groups/:accessGroupName/edit" component={AccessGroupFormContainer} />
        <Route exact path="/access-groups/:accessGroupName/members" component={AccessGroupMembersFormContainer} />

        <Route exact path="/content" component={ContentLibrariesContainer} />
        <Route exact path="/content/create" component={ContentLibraryFormContainer} />

        /**
        * For most content routes, add content-types route corresponding
        * to /content/:contentSpaceLibrary
        */
        <Route exact path="/content/:libraryId" component={ContentLibraryContainer} />
        <Route exact path="/content-types" render={(props) =>
          <ContentLibraryContainer libraryId={Fabric.contentSpaceLibraryId} {...props} />} />

        <Route exact path="/content/:libraryId/edit" component={ContentLibraryFormContainer} />
        <Route exact path="/content-types/edit" render={(props) =>
          <ContentLibraryFormContainer libraryId={Fabric.contentSpaceLibraryId} {...props} />} />

        <Route exact path="/content/:libraryId/groups" component={ContentLibraryGroupsFormContainer} />
        <Route exact path="/content-types/groups" render={(props) =>
          <ContentLibraryGroupsFormContainer libraryId={Fabric.contentSpaceLibraryId} {...props} />} />

        <Route exact path="/content/:libraryId/create" component={ContentObjectFormContainer} />
        <Route exact path="/content-types/create" render={(props) =>
          <ContentObjectFormContainer libraryId={Fabric.contentSpaceLibraryId} {...props} />} />

        <Route exact path="/content/:libraryId/:objectId" component={ContentObjectContainer} />
        <Route exact path="/content-types/:objectId" render={(props) =>
          <ContentObjectContainer libraryId={Fabric.contentSpaceLibraryId} {...props} />} />

        <Route exact path="/content/:libraryId/:objectId/edit" component={ContentObjectFormContainer} />
        <Route exact path="/content-types/:objectId/edit" render={(props) =>
          <ContentObjectFormContainer libraryId={Fabric.contentSpaceLibraryId} {...props} />} />

        <Route exact path="/content/:libraryId/:objectId/upload" component={ContentObjectUploadFormContainer} />
        <Route exact path="/content-types/:objectId/upload" render={(props) =>
          <ContentObjectUploadFormContainer libraryId={Fabric.contentSpaceLibraryId} {...props} />} />

        <Route exact path="/content/:libraryId/:objectId/app" component={ContentObjectAppContainer} />
        <Route exact path="/content-types/:objectId/app" render={(props) =>
          <ContentObjectAppContainer libraryId={Fabric.contentSpaceLibraryId} {...props} />} />

        <Route exact path="/content/:libraryId/:objectId/deploy" component={DeployContentContractFormContainer} />
        <Route exact path="/content-types/:objectId/deploy" render={(props) =>
          <DeployContentContractFormContainer libraryId={Fabric.contentSpaceLibraryId} {...props} />} />

        /* Base content contract */
        <Route exact path="/content/:libraryId/:objectId/contract" component={ContentContractContainer} />
        <Route exact path="/content-types/:objectId/contract" render={(props) =>
          <ContentContractContainer libraryId={Fabric.contentSpaceLibraryId} {...props} />} />

        <Route exact path="/content/:libraryId/:objectId/contract/funds" component={ContentContractFundsFormContainer} />
        <Route exact path="/content-types/:objectId/contract/funds" render={(props) =>
          <ContentContractFundsFormContainer libraryId={Fabric.contentSpaceLibraryId} {...props} />} />

        <Route exact path="/content/:libraryId/:objectId/contract/call/:method" component={ContentContractMethodFormContainer} />
        <Route exact path="/content-types/:objectId/contract/call/:method" render={(props) =>
          <ContentContractMethodFormContainer libraryId={Fabric.contentSpaceLibraryId} {...props} />} />

        /* Custom content contract */
        <Route exact path="/content/:libraryId/:objectId/custom-contract" component={ContentContractContainer} />
        <Route exact path="/content-types/:objectId/custom-contract" render={(props) =>
          <ContentContractContainer libraryId={Fabric.contentSpaceLibraryId} {...props} />} />

        <Route exact path="/content/:libraryId/:objectId/custom-contract/funds" component={ContentContractFundsFormContainer} />
        <Route exact path="/content-types/:objectId/custom-contract/funds" render={(props) =>
          <ContentContractFundsFormContainer libraryId={Fabric.contentSpaceLibraryId} {...props} />} />

        <Route exact path="/content/:libraryId/:objectId/custom-contract/call/:method" component={ContentContractMethodFormContainer} />
        <Route exact path="/content-types/:objectId/custom-contract/call/:method" render={(props) =>
          <ContentContractMethodFormContainer libraryId={Fabric.contentSpaceLibraryId} {...props} />} />

        
        <Route exact path="/contracts" component={ContractsContainer} />
        <Route exact path="/contracts/compile" component={CompileContractFormContainer} />
        <Route exact path="/contracts/save" component={ContractFormContainer} />
        <Route exact path="/contracts/:contractName" component={ContractContainer} />
        <Route exact path="/contracts/:contractName/edit" component={ContractFormContainer} />
      </Switch>
    </div>
  );
}

// Wrap the router in an error handler to ensure a crash in the main content does not
// crash the entire app (particularly, the navbar)
export default (props) => <ErrorHandler component={Routes} {...props} />;

