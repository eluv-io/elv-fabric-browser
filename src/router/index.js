import React from "react";
import {Route, Switch} from "react-router";
import Path from "path";

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
  ContentLibraryContainer,
  ContentObjectContainer,
  ContentObjectFormContainer,
  ContentObjectUploadFormContainer, ContentObjectAppContainer
} from "../containers/pages/Content";

import {
  CompileContractFormContainer,
  ContractFormContainer,
  ContractsContainer,
  DeployContentContractFormContainer
} from "../containers/pages/Contracts";
import Services from "../containers/pages/Services";
import Fabric from "../clients/Fabric";

// Inject content space library ID into match parameters
const ContentTypeRoute = ({subPath, component}) => {
  const ContentRoute = (args) => {
    args.match.params.libraryId = Fabric.contentSpaceLibraryId;

    return React.createElement(component, args);
  };

  return <Route exact path={Path.join("/content-types", subPath)} component={ContentRoute} />;
};

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

        <Route exact path="/content/:libraryId" component={ContentLibraryContainer} />
        <Route exact path="/content/:libraryId/edit" component={ContentLibraryFormContainer} />
        <Route exact path="/content/:libraryId/create" component={ContentObjectFormContainer} />
        <Route exact path="/content/:libraryId/:objectId" component={ContentObjectContainer} />
        <Route exact path="/content/:libraryId/:objectId/edit" component={ContentObjectFormContainer} />
        <Route exact path="/content/:libraryId/:objectId/upload" component={ContentObjectUploadFormContainer} />
        <Route exact path="/content/:libraryId/:objectId/app" component={ContentObjectAppContainer} />
        <Route exact path="/content/:libraryId/:objectId/deploy" component={DeployContentContractFormContainer} />

        { ContentTypeRoute({subPath: "/", component: ContentLibraryContainer}) }
        { ContentTypeRoute({subPath: "/edit", component: ContentLibraryFormContainer}) }
        { ContentTypeRoute({subPath: "/create", component: ContentObjectFormContainer}) }
        { ContentTypeRoute({subPath: "/:objectId", component: ContentObjectContainer}) }
        { ContentTypeRoute({subPath: "/:objectId/edit", component: ContentObjectFormContainer}) }
        { ContentTypeRoute({subPath: "/:objectId/upload", component: ContentObjectUploadFormContainer}) }
        { ContentTypeRoute({subPath: "/:objectId/app", component: ContentObjectAppContainer}) }
        { ContentTypeRoute({subPath: "/:objectId/deploy", component: DeployContentContractFormContainer}) }

        <Route exact path="/contracts" component={ContractsContainer} />
        <Route exact path="/contracts/compile" component={CompileContractFormContainer} />
        <Route exact path="/contracts/save" component={ContractFormContainer} />
        <Route path="/services" component={Services} />
      </Switch>
    </div>
  );
}

export default Routes;
