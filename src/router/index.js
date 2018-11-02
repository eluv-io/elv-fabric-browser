import React from "react";
import {Route, Switch} from "react-router";

import AccessGroups from "../containers/pages/AccessGroups";
import {
  AccountsContainer,
  AccountFormContainer,
  AccountContainer,
  AccountInfoFormContainer
} from "../containers/pages/Accounts";

import {
  ContentLibrariesContainer,
  ContentLibraryFormContainer,
  ContentObjectsContainer,
  ContentObjectContainer,
  ContentObjectFormContainer,
  ContentObjectUploadFormContainer, ContentObjectAppContainer
} from "../containers/pages/Content";

import {
  CompileContractFormContainer,
  DeployContractFormContainer
} from "../containers/pages/Contracts";
import Services from "../containers/pages/Services";

function Routes(){
  return (
    <div className="main-content-container">
      <Switch>
        <Route exact path="/" component={ContentLibrariesContainer} />

        <Route path="/access-groups" component={AccessGroups} />

        <Route exact path="/accounts" component={AccountsContainer} />
        <Route exact path="/accounts/create" component={AccountFormContainer} />
        <Route exact path="/accounts/:accountAddress" component={AccountContainer} />
        <Route exact path="/accounts/:accountAddress/edit" component={AccountInfoFormContainer} />

        <Route exact path="/content" component={ContentLibrariesContainer} />
        <Route exact path="/content/create" component={ContentLibraryFormContainer} />
        <Route exact path="/content/:libraryId" component={ContentObjectsContainer} />
        <Route exact path="/content/:libraryId/create" component={ContentObjectFormContainer} />
        <Route exact path="/content/:libraryId/:objectId" component={ContentObjectContainer} />
        <Route exact path="/content/:libraryId/:objectId/edit" component={ContentObjectFormContainer} />
        <Route exact path="/content/:libraryId/:objectId/upload" component={ContentObjectUploadFormContainer} />
        <Route exact path="/content/:libraryId/:objectId/app" component={ContentObjectAppContainer} />

        <Route exact path="/content-types" component={ContentLibrariesContainer} />

        <Route exact path="/contracts" component={CompileContractFormContainer} />
        <Route exact path="/contracts/deploy" component={DeployContractFormContainer} />
        <Route path="/services" component={Services} />
      </Switch>
    </div>
  );
}

export default Routes;
