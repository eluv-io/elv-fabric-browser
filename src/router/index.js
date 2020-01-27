import React from "react";
import {Route, Switch} from "react-router";
import Fabric from "../clients/Fabric";
import {inject, observer} from "mobx-react";
import {reaction} from "mobx";

import {ErrorHandler} from "elv-components-js";

import ContentLibrariesPage from "../components/pages/content/ContentLibraries";
import ContentLibraryPage from "../components/pages/content/ContentLibrary";
import ContentLibraryFormPage from "../components/pages/content/ContentLibraryForm";
import ContentLibraryGroupFormPage from "../components/pages/content/ContentLibraryGroupForm";
import ContentLibraryTypesFormPage from "../components/pages/content/ContentLibraryTypesForm";

import ContentTypesPage from "../components/pages/content/ContentTypes";
import ContentTypeFormPage from "../components/pages/content/ContentTypeForm";

import ContentObjectPage from "../components/pages/content/ContentObject";
import ContentObjectFormPage from "../components/pages/content/ContentObjectForm";
import ContentObjectReviewFormPage from "../components/pages/content/ContentObjectReviewForm";
import ContentObjectGroupFormPage from "../components/pages/content/ContentObjectGroupForm";
import ContentObjectPartsFormPage from "../components/pages/content/ContentObjectPartsForm";
import ContentObjectAppsPage from "../components/pages/content/ContentApps";

import AccessGroupsPage from "../components/pages/access_groups/AccessGroups";
import AccessGroupPage from "../components/pages/access_groups/AccessGroup";
import AccessGroupFormPage from "../components/pages/access_groups/AccessGroupForm";
import AccessGroupMemberFormPage from "../components/pages/access_groups/AccessGroupMemberForm";

import ContractsPage from "../components/pages/contracts/Contracts";
import ContractPage from "../components/pages/contracts/Contract";
import CompileContractFormPage from "../components/pages/contracts/CompileContractForm";
import ContractFormPage from "../components/pages/contracts/ContractForm";
import WatchContractFormPage from "../components/pages/contracts/WatchContractForm";
import DeployContractFormPage from "../components/pages/contracts/DeployContractForm";

import DeployedContractPage from "../components/pages/contracts/deployed/DeployedContract";
import DeployedContractFundsFormPage from "../components/pages/contracts/deployed/DeployedContractFundsForm";
import DeployedContractEventsPage from "../components/pages/contracts/deployed/DeployedContractEvents";

import EventsPage from "../components/pages/events/Events";
import withRouter from "react-router/es/withRouter";
import { Redirect } from "react-router";

@inject("notificationStore")
@inject("routeStore")
@observer
// Update app state and notify Core whenever route changes
class WatchedRouteClass extends React.Component {
  async componentDidMount() {
    this.setState({
      DisposeRouteReaction: reaction(
        () => ({
          match: JSON.stringify(this.props.match)
        }),
        async () => {
          await this.props.routeStore.UpdateRoute(
            this.props.computedMatch
          );

          this.setState({
            routeSet: true
          });
        }
      )
    });

    // Initial load
    await this.props.routeStore.UpdateRoute(
      this.props.computedMatch
    );
  }

  componentWillUnmount() {
    if(this.state.DisposeRouteReaction) {
      this.state.DisposeRouteReaction();
    }
  }

  render() {
    return (
      <Route
        exact={this.props.exact}
        path={this.props.path}
        component={withRouter(this.props.component)}
      />
    );
  }
}

const WatchedRoute = withRouter(ErrorHandler(WatchedRouteClass));

class Router extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      initialized: false
    };
  }

  async componentWillMount() {
    await Fabric.Initialize();

    this.setState({initialized: true});
  }

  render() {
    // Wait for Fabric client to initialize before rendering
    if(!this.state.initialized) {
      return null;
    }

    return (
      <div className="main-content-container">
        <Switch>
          <WatchedRoute exact path="/" component={ContentLibrariesPage}/>

          /* Access Groups */

          <WatchedRoute exact path="/access-groups" component={AccessGroupsPage}/>
          <WatchedRoute exact path="/access-groups/create" component={AccessGroupFormPage}/>
          <WatchedRoute exact path="/access-groups/:contractAddress" component={AccessGroupPage}/>
          <WatchedRoute exact path="/access-groups/:contractAddress/edit" component={AccessGroupFormPage}/>
          <WatchedRoute exact path="/access-groups/:contractAddress/add-member" component={AccessGroupMemberFormPage}/>
          <WatchedRoute exact path="/access-groups/:contractAddress/contract" component={DeployedContractPage}/>
          <WatchedRoute exact path="/access-groups/:contractAddress/contract/events" component={DeployedContractEventsPage}/>
          <WatchedRoute exact path="/access-groups/:contractAddress/contract/funds" component={DeployedContractFundsFormPage}/>

          /* Content */
          /* For most content routes, add content-types route corresponding to /content/:contentSpaceLibrary */

          <WatchedRoute exact path="/content-types" component={ContentTypesPage} />

          <WatchedRoute exact path="/content" component={ContentLibrariesPage}/>
          <WatchedRoute exact path="/content/create" component={ContentLibraryFormPage}/>

          <WatchedRoute exact path="/content/:libraryId" component={ContentLibraryPage}/>

          <WatchedRoute exact path="/content/:libraryId/edit" component={ContentLibraryFormPage}/>

          <WatchedRoute exact path="/content/:libraryId/groups" component={ContentLibraryGroupFormPage}/>
          <WatchedRoute exact path="/content/:libraryId/types" component={ContentLibraryTypesFormPage}/>

          <WatchedRoute exact path="/content/:libraryId/create" component={ContentObjectFormPage}/>
          <WatchedRoute exact path="/content-types/create" component={ContentTypeFormPage} />

          <WatchedRoute exact path="/content/:libraryId/:objectId" component={ContentObjectPage}/>
          <WatchedRoute exact path="/content-types/:objectId" component={ContentObjectPage}/>

          <WatchedRoute exact path="/content/:libraryId/:objectId/edit" component={ContentObjectFormPage}/>
          <WatchedRoute exact path="/content-types/:objectId/edit" component={ContentTypeFormPage} />

          <WatchedRoute exact path="/content/:libraryId/:objectId/review" component={ContentObjectReviewFormPage}/>

          <WatchedRoute exact path="/content/:libraryId/:objectId/upload" component={ContentObjectPartsFormPage}/>
          <WatchedRoute exact path="/content-types/:objectId/upload" component={ContentObjectPartsFormPage}/>

          <WatchedRoute exact path="/content/:libraryId/:objectId/groups" component={ContentObjectGroupFormPage} />

          <WatchedRoute exact path="/content/:libraryId/:objectId/apps" component={ContentObjectAppsPage}/>
          <WatchedRoute exact path="/content-types/:objectId/apps" component={ContentObjectAppsPage} />

          <WatchedRoute exact path="/content/:libraryId/:objectId/deploy" component={DeployContractFormPage}/>
          <WatchedRoute exact path="/content-types/:objectId/deploy" component={DeployContractFormPage}/>

          /* Base content contract */
          <WatchedRoute exact path="/content/:libraryId/:objectId/contract" component={DeployedContractPage}/>
          <WatchedRoute exact path="/content-types/:objectId/contract" component={DeployedContractPage}/>

          <WatchedRoute exact path="/content/:libraryId/:objectId/contract/events" component={DeployedContractEventsPage}/>
          <WatchedRoute exact path="/content-types/:objectId/contract/events" component={DeployedContractEventsPage}/>

          <WatchedRoute exact path="/content/:libraryId/:objectId/contract/funds" component={DeployedContractFundsFormPage}/>
          <WatchedRoute exact path="/content-types/:objectId/contract/funds" component={DeployedContractFundsFormPage}/>

          /* Custom content contract */
          <WatchedRoute exact path="/content/:libraryId/:objectId/custom-contract" component={DeployedContractPage}/>
          <WatchedRoute exact path="/content-types/:objectId/custom-contract" component={DeployedContractPage}/>

          <WatchedRoute exact path="/content/:libraryId/:objectId/custom-contract/events" component={DeployedContractEventsPage}/>
          <WatchedRoute exact path="/content-types/:objectId/custom-contract/events" component={DeployedContractEventsPage}/>

          <WatchedRoute exact path="/content/:libraryId/:objectId/custom-contract/funds" component={DeployedContractFundsFormPage}/>
          <WatchedRoute exact path="/content-types/:objectId/custom-contract/funds" component={DeployedContractFundsFormPage}/>

          /* Contracts */

          <WatchedRoute exact path="/contracts" component={ContractsPage}/>
          <WatchedRoute exact path="/contracts/saved" component={ContractsPage}/>
          <WatchedRoute exact path="/contracts/deployed" component={ContractsPage}/>
          <WatchedRoute exact path="/contracts/compile" component={CompileContractFormPage}/>
          <WatchedRoute exact path="/contracts/save" component={ContractFormPage}/>
          <WatchedRoute exact path="/contracts/watch" component={WatchContractFormPage}/>
          <WatchedRoute exact path="/contracts/deploy" component={DeployContractFormPage}/>
          <WatchedRoute exact path="/contracts/deployed/:contractAddress" component={DeployedContractPage}/>
          <WatchedRoute exact path="/contracts/deployed/:contractAddress/events" component={DeployedContractEventsPage}/>
          <WatchedRoute exact path="/contracts/deployed/:contractAddress/funds" component={DeployedContractFundsFormPage}/>
          <WatchedRoute exact path="/contracts/:contractName" component={ContractPage}/>
          <WatchedRoute exact path="/contracts/:contractName/edit" component={ContractFormPage}/>
          <WatchedRoute exact path="/contracts/:contractName/deploy" component={DeployContractFormPage}/>

          /* Logs */
          <WatchedRoute exact path="/events" component={EventsPage} />

          <Redirect from="*" to="/content" />
        </Switch>
      </div>
    );
  }
}

export default Router;
