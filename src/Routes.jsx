import {useEffect, useState} from "react";
import Fabric from "@/client/Fabric";
import {observer} from "mobx-react";
import {rootStore, routeStore} from "@/stores/index";
import {Switch, Route, Redirect, useLocation, useParams} from "wouter";

import ContentLibrariesPage from "@/pages/content/ContentLibraries";
import ContentLibraryPage from "@/pages/content/ContentLibrary";

import ContentObjectPage from "@/pages/content/ContentObject";

import AccessGroupsPage from "@/pages/access_groups/AccessGroups";

import ContentTypesPage from "@/pages/content/ContentTypes";

import EventsPage from "@/pages/events/Events";
import AccessGroupPage from "@/pages/access_groups/AccessGroup";
import ContentLibraryForm from "@/pages/content/ContentLibraryForm";
import ContentObjectForm from "@/pages/content/ContentObjectForm";

/*
import ContentLibraryPage from "@/pages/content/ContentLibrary";
import ContentLibraryFormPage from "@/pages/content/ContentLibraryForm";
import ContentLibraryTypesFormPage from "@/pages/content/ContentLibraryTypesForm";

import ContentTypesPage from "@/pages/content/ContentTypes";
import ContentTypeFormPage from "@/pages/content/ContentTypeForm";

import ContentObjectPage from "@/pages/content/ContentObject";
import ContentObjectFormPage from "@/pages/content/ContentObjectForm";
import ContentObjectReviewFormPage from "@/pages/content/ContentObjectReviewForm";
import ContentObjectGroupFormPage from "@/pages/content/ContentObjectGroupForm";
import ContentObjectPartsFormPage from "@/pages/content/ContentObjectPartsForm";
import ContentObjectAppsPage from "@/pages/content/ContentApps";


import AccessGroupPage from "@/pages/access_groups/AccessGroup";
import AccessGroupFormPage from "@/pages/access_groups/AccessGroupForm";
import AccessGroupMemberFormPage from "@/pages/access_groups/AccessGroupMemberForm";

import ContractsPage from "@/pages/contracts/Contracts";
import ContractPage from "@/pages/contracts/Contract";
import CompileContractFormPage from "@/pages/contracts/CompileContractForm";
import ContractFormPage from "@/pages/contracts/ContractForm";
import WatchContractFormPage from "@/pages/contracts/WatchContractForm";
import DeployContractFormPage from "@/pages/contracts/DeployContractForm";

import DeployedContractPage from "@/pages/contracts/deployed/DeployedContract";
import DeployedContractFundsFormPage from "@/pages/contracts/deployed/DeployedContractFundsForm";
import DeployedContractEventsPage from "@/pages/contracts/deployed/DeployedContractEvents";

import EventsPage from "@/pages/events/Events";
 */

const TestRoute = observer(({Component}) => {
  const params = useParams();
  const [location] = useLocation();

  useEffect(() => {
    routeStore.UpdateRoute({path: location, params});
  }, [location, params]);

  return <Component />;
});

const WatchedRoute = observer(({component, ...props}) => {
  return (
    <Route {...props}>
      <TestRoute Component={component} />
    </Route>
  );
});

const Router = observer(() => {
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    Fabric.Initialize()
      .then(() => setInitialized(true));
  }, []);

  if(!initialized) {
    return null;
  }

  return (
      <Switch>
        <WatchedRoute exact path="/content/:libraryId/edit" component={ContentLibraryForm}/>
        <WatchedRoute exact path="/content" component={ContentLibrariesPage}/>
        <WatchedRoute exact path="/content/create" component={ContentLibraryForm}/>
        <WatchedRoute exact path="/content/:libraryId" component={ContentLibraryPage}/>
        <WatchedRoute exact path="/content/:libraryId/create" component={ContentObjectForm}/>
        <WatchedRoute exact path="/content/:libraryId/:objectId" component={ContentObjectPage}/>
        <WatchedRoute exact path="/content/:libraryId/:objectId/edit" component={ContentObjectForm}/>

        <WatchedRoute exact path="/access-groups" component={AccessGroupsPage}/>
        <WatchedRoute exact path="/access-groups/:contractAddress" component={AccessGroupPage}/>

        <WatchedRoute exact path="/content-types" component={ContentTypesPage} />
        <WatchedRoute exact path="/content-types/:objectId" component={ContentObjectPage}/>

        <WatchedRoute exact path="/events" component={EventsPage} />

        <Route><Redirect to="/content"/></Route>
      </Switch>
  );


  return (
    <div className="main-content-container">
      <Switch>
        <WatchedRoute exact path="/" component={ContentLibrariesPage}/>

        { /* Access Groups */ }

        <WatchedRoute exact path="/access-groups" component={AccessGroupsPage}/>
        <WatchedRoute exact path="/access-groups/create" component={AccessGroupFormPage}/>
        <WatchedRoute exact path="/access-groups/:contractAddress" component={AccessGroupPage}/>
        <WatchedRoute exact path="/access-groups/:contractAddress/edit" component={AccessGroupFormPage}/>
        <WatchedRoute exact path="/access-groups/:contractAddress/add-member" component={AccessGroupMemberFormPage}/>
        <WatchedRoute exact path="/access-groups/:contractAddress/groups" component={ContentObjectGroupFormPage}/>
        <WatchedRoute exact path="/access-groups/:contractAddress/contract" component={DeployedContractPage}/>
        <WatchedRoute exact path="/access-groups/:contractAddress/contract/events"
                      component={DeployedContractEventsPage}/>
        <WatchedRoute exact path="/access-groups/:contractAddress/contract/funds"
                      component={DeployedContractFundsFormPage}/>

        { /* Content */ }
        { /* For most content routes, add content-types route corresponding to /content/:contentSpaceLibrary */ }

        <WatchedRoute exact path="/content-types" component={ContentTypesPage}/>

        <WatchedRoute exact path="/content" component={ContentLibrariesPage}/>
        <WatchedRoute exact path="/content/create" component={ContentLibraryFormPage}/>

        <WatchedRoute exact path="/content/:libraryId" component={ContentLibraryPage}/>

        <WatchedRoute exact path="/content/:libraryId/edit" component={ContentLibraryFormPage}/>

        <WatchedRoute exact path="/content/:libraryId/types" component={ContentLibraryTypesFormPage}/>

        <WatchedRoute exact path="/content/:libraryId/create" component={ContentObjectFormPage}/>
        <WatchedRoute exact path="/content-types/create" component={ContentTypeFormPage}/>

        <WatchedRoute exact path="/content/:libraryId/:objectId" component={ContentObjectPage}/>
        <WatchedRoute exact path="/content-types/:objectId" component={ContentObjectPage}/>

        <WatchedRoute exact path="/content/:libraryId/:objectId/edit" component={ContentObjectFormPage}/>
        <WatchedRoute exact path="/content-types/:objectId/edit" component={ContentTypeFormPage}/>

        <WatchedRoute exact path="/content/:libraryId/:objectId/review" component={ContentObjectReviewFormPage}/>

        <WatchedRoute exact path="/content/:libraryId/:objectId/upload" component={ContentObjectPartsFormPage}/>
        <WatchedRoute exact path="/content-types/:objectId/upload" component={ContentObjectPartsFormPage}/>

        <WatchedRoute exact path="/content/:libraryId/:objectId/groups" component={ContentObjectGroupFormPage}/>

        <WatchedRoute exact path="/content/:libraryId/:objectId/apps" component={ContentObjectAppsPage}/>
        <WatchedRoute exact path="/content-types/:objectId/apps" component={ContentObjectAppsPage}/>

        <WatchedRoute exact path="/content/:libraryId/:objectId/deploy" component={DeployContractFormPage}/>
        <WatchedRoute exact path="/content-types/:objectId/deploy" component={DeployContractFormPage}/>

        { /* Base content contract */ }
        <WatchedRoute exact path="/content/:libraryId/:objectId/contract" component={DeployedContractPage}/>
        <WatchedRoute exact path="/content-types/:objectId/contract" component={DeployedContractPage}/>

        <WatchedRoute exact path="/content/:libraryId/:objectId/contract/events"
                      component={DeployedContractEventsPage}/>
        <WatchedRoute exact path="/content-types/:objectId/contract/events" component={DeployedContractEventsPage}/>

        <WatchedRoute exact path="/content/:libraryId/:objectId/contract/funds"
                      component={DeployedContractFundsFormPage}/>
        <WatchedRoute exact path="/content-types/:objectId/contract/funds" component={DeployedContractFundsFormPage}/>

        { /* Custom content contract */ }
        <WatchedRoute exact path="/content/:libraryId/:objectId/custom-contract" component={DeployedContractPage}/>
        <WatchedRoute exact path="/content-types/:objectId/custom-contract" component={DeployedContractPage}/>

        <WatchedRoute exact path="/content/:libraryId/:objectId/custom-contract/events"
                      component={DeployedContractEventsPage}/>
        <WatchedRoute exact path="/content-types/:objectId/custom-contract/events"
                      component={DeployedContractEventsPage}/>

        <WatchedRoute exact path="/content/:libraryId/:objectId/custom-contract/funds"
                      component={DeployedContractFundsFormPage}/>
        <WatchedRoute exact path="/content-types/:objectId/custom-contract/funds"
                      component={DeployedContractFundsFormPage}/>

        { /* Contracts */ }

        <WatchedRoute exact path="/contracts" component={ContractsPage}/>
        <WatchedRoute exact path="/contracts/saved" component={ContractsPage}/>
        <WatchedRoute exact path="/contracts/deployed" component={ContractsPage}/>
        <WatchedRoute exact path="/contracts/compile" component={CompileContractFormPage}/>
        <WatchedRoute exact path="/contracts/save" component={ContractFormPage}/>
        <WatchedRoute exact path="/contracts/watch" component={WatchContractFormPage}/>
        <WatchedRoute exact path="/contracts/deploy" component={DeployContractFormPage}/>
        <WatchedRoute exact path="/contracts/deployed/:contractAddress" component={DeployedContractPage}/>
        <WatchedRoute exact path="/contracts/deployed/:contractAddress/events" component={DeployedContractEventsPage}/>
        <WatchedRoute exact path="/contracts/deployed/:contractAddress/funds"
                      component={DeployedContractFundsFormPage}/>
        <WatchedRoute exact path="/contracts/:contractName" component={ContractPage}/>
        <WatchedRoute exact path="/contracts/:contractName/edit" component={ContractFormPage}/>
        <WatchedRoute exact path="/contracts/:contractName/deploy" component={DeployContractFormPage}/>

        { /* Logs */ }
        <WatchedRoute exact path="/events" component={EventsPage}/>

        <Route><Redirect to="/content"/></Route>
      </Switch>
    </div>
  );
});

export default Router;
