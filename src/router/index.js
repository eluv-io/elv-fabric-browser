import React from "react";
import {Route, Switch} from "react-router";
import Fabric from "../clients/Fabric";
import ErrorHandler from "./ErrorHandler";
import Redirect from "react-router/es/Redirect";
import connect from "react-redux/es/connect/connect";
import Thunk from "../utils/Thunk";
import {GetFramePath, StartRouteSynchronization} from "../actions/Routing";

/* Content Libraries */
import ContentLibrariesContainer from "../containers/pages/content/ContentLibraries";
import ContentLibraryContainer from "../containers/pages/content/ContentLibrary";
import ContentLibraryFormContainer from "../containers/pages/content/ContentLibraryForm";
import ContentLibraryTypesFormContainer from "../containers/pages/content/ContentLibraryTypesForm";
import ContentLibraryGroupsFormContainer from "../containers/pages/content/ContentLibraryGroupsForm";

/* Content Objects, Types and Apps */
import ContentObjectContainer from "../containers/pages/content/ContentObject";
import ContentObjectFormContainer from "../containers/pages/content/ContentObjectForm";
import ContentObjectPartsFormContainer from "../containers/pages/content/ContentObjectPartsForm";
import ContentObjectReviewFormContainer from "../containers/pages/content/ContentObjectReviewForm";

import ContentTypeFormContainer from "../containers/pages/content/ContentTypeForm";

import ContentAppsContainer from "../containers/pages/content/ContentApps";
import ContentAppFormContainer from "../containers/pages/content/ContentAppForm";

/* Access Groups */
import AccessGroupsContainer from "../containers/pages/access_groups/AccessGroups";
import AccessGroupContainer from "../containers/pages/access_groups/AccessGroup";
import AccessGroupFormContainer from "../containers/pages/access_groups/AccessGroupForm";
import AccessGroupMembersFormContainer from "../containers/pages/access_groups/AccessGroupMembersForm";

/* Contracts */
import ContractsContainer from "../containers/pages/contracts/Contracts";
import ContractContainer from "../containers/pages/contracts/Contract";
import CompileContractFormContainer from "../containers/pages/contracts/CompileContractForm";
import ContractFormContainer from "../containers/pages/contracts/ContractForm";
import WatchContractFormContainer from "../containers/pages/contracts/WatchContractForm";
import DeployContractFormContainer from "../containers/pages/contracts/DeployContractForm";

/* Deployed Contracts */
import DeployedContractContainer from "../containers/pages/contracts/deployed/DeployedContract";
import DeployedContractFundsFormContainer from "../containers/pages/contracts/deployed/DeployedContractFundsForm";
import DeployedContractEventsContainer from "../containers/pages/contracts/deployed/DeployedContractEvents";

/* Blockchain Logs */
import LogsContainer from "../containers/pages/Logs";

const ConnectedSwitch =
  connect(state => ({location: state.router.location}))(Switch);

class Router extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      redirectPath: "",
      pathSynchronized: false
    };

    if(Fabric.isFrameClient) {
      this.props.GetFramePath();
    }
  }

  // If using FrameClient, determine app path specified in url by requesting it from core-js,
  // then redirect to it. After synchronized with initial URL, keep the URL synchronized with
  // app routing changes by signalling RoutingReducer to intercept route changes and send them
  // up to the container.
  async componentDidUpdate() {
    if(!this.state.pathSynchronized) {
      if(Fabric.isFrameClient) {
        if(this.props.frameRouting.path === undefined) { return; }

        if(this.props.frameRouting.path !== this.props.router.location.pathname) {
          this.setState({redirectPath: this.props.frameRouting.path});
        } else {
          this.setState({
            redirectPath: "",
            pathSynchronized: true
          });

          this.props.StartRouteSynchronization();
        }
        await Fabric.Initialize();
      } else {
        await Fabric.Initialize();
        this.setState({pathSynchronized: true});
      }
    }
  }

  render() {
    // Redirect to initial path if necessary
    if(!this.state.pathSynchronized
      && this.state.redirectPath
      && this.state.redirectPath !== this.props.router.location.pathname) {
      return <Redirect to={this.state.redirectPath} />;
    } else if(!this.state.pathSynchronized) {
      // Don't render until path is synchronized
      return null;
    }

    return (
      <div className="main-content-container">
        <ConnectedSwitch>
          <Route exact path="/" component={ContentLibrariesContainer}/>

          /* Access Groups */

          <Route exact path="/access-groups" component={AccessGroupsContainer}/>
          <Route exact path="/access-groups/create" component={AccessGroupFormContainer}/>
          <Route exact path="/access-groups/:contractAddress" component={AccessGroupContainer}/>
          <Route exact path="/access-groups/:contractAddress/edit" component={AccessGroupFormContainer}/>
          <Route exact path="/access-groups/:contractAddress/members" component={AccessGroupMembersFormContainer}/>
          <Route exact path="/access-groups/:contractAddress/contract" component={DeployedContractContainer}/>
          <Route exact path="/access-groups/:contractAddress/contract/logs" component={DeployedContractEventsContainer}/>
          <Route exact path="/access-groups/:contractAddress/contract/funds" component={DeployedContractFundsFormContainer}/>

          /* Content */
          /* For most content routes, add content-types route corresponding to /content/:contentSpaceLibrary */

          <Route exact path="/content" component={ContentLibrariesContainer}/>
          <Route exact path="/content/create" component={ContentLibraryFormContainer}/>

          <Route exact path="/content/:libraryId" component={ContentLibraryContainer}/>
          <Route exact path="/content-types" key="content-types" render={(props) =>
            <ContentLibraryContainer libraryId={Fabric.contentSpaceLibraryId} {...props} />}/>

          <Route exact path="/content/:libraryId/edit" component={ContentLibraryFormContainer}/>
          <Route exact path="/content-types/edit" render={(props) =>
            <ContentLibraryFormContainer libraryId={Fabric.contentSpaceLibraryId} {...props} />}/>

          <Route exact path="/content/:libraryId/groups" component={ContentLibraryGroupsFormContainer}/>
          <Route exact path="/content-types/groups" render={(props) =>
            <ContentLibraryGroupsFormContainer libraryId={Fabric.contentSpaceLibraryId} {...props} />}/>

          <Route exact path="/content/:libraryId/types" component={ContentLibraryTypesFormContainer}/>

          <Route exact path="/content/:libraryId/create" component={ContentObjectFormContainer}/>
          <Route exact path="/content-types/create" render={(props) =>
            <ContentTypeFormContainer libraryId={Fabric.contentSpaceLibraryId} {...props} />}/>

          <Route exact path="/content/:libraryId/:objectId" component={ContentObjectContainer}/>
          <Route exact path="/content-types/:objectId" render={(props) =>
            <ContentObjectContainer libraryId={Fabric.contentSpaceLibraryId} {...props} />}/>

          <Route exact path="/content/:libraryId/:objectId/edit" component={ContentObjectFormContainer}/>
          <Route exact path="/content-types/:objectId/edit" render={(props) =>
            <ContentTypeFormContainer libraryId={Fabric.contentSpaceLibraryId} {...props} />}/>

          <Route exact path="/content/:libraryId/:objectId/review" component={ContentObjectReviewFormContainer}/>

          <Route exact path="/content/:libraryId/:objectId/upload" component={ContentObjectPartsFormContainer}/>
          <Route exact path="/content-types/:objectId/upload" render={(props) =>
            <ContentObjectPartsFormContainer libraryId={Fabric.contentSpaceLibraryId} {...props} />}/>

          <Route exact path="/content/:libraryId/:objectId/apps" component={ContentAppsContainer}/>
          <Route exact path="/content-types/:objectId/apps" render={(props) =>
            <ContentAppsContainer libraryId={Fabric.contentSpaceLibraryId} {...props} />}/>

          <Route exact path="/content/:libraryId/:objectId/apps/:role/add" component={ContentAppFormContainer}/>
          <Route exact path="/content-types/:objectId/apps/:role/add" render={(props) =>
            <ContentAppFormContainer libraryId={Fabric.contentSpaceLibraryId} {...props} />}/>

          <Route exact path="/content/:libraryId/:objectId/deploy" component={DeployContractFormContainer}/>
          <Route exact path="/content-types/:objectId/deploy" render={(props) =>
            <DeployContractFormContainer libraryId={Fabric.contentSpaceLibraryId} {...props} />}/>

          /* Base content contract */
          <Route exact path="/content/:libraryId/:objectId/contract" component={DeployedContractContainer}/>
          <Route exact path="/content-types/:objectId/contract" render={(props) =>
            <DeployedContractContainer libraryId={Fabric.contentSpaceLibraryId} {...props} />}/>

          <Route exact path="/content/:libraryId/:objectId/contract/logs"
            component={DeployedContractEventsContainer}/>
          <Route exact path="/content-types/:objectId/contract/logs" render={(props) =>
            <DeployedContractEventsContainer libraryId={Fabric.contentSpaceLibraryId} {...props} />}/>

          <Route exact path="/content/:libraryId/:objectId/contract/funds"
            component={DeployedContractFundsFormContainer}/>
          <Route exact path="/content-types/:objectId/contract/funds" render={(props) =>
            <DeployedContractFundsFormContainer libraryId={Fabric.contentSpaceLibraryId} {...props} />}/>

          /* Custom content contract */
          <Route exact path="/content/:libraryId/:objectId/custom-contract" component={DeployedContractContainer}/>
          <Route exact path="/content-types/:objectId/custom-contract" render={(props) =>
            <DeployedContractContainer libraryId={Fabric.contentSpaceLibraryId} {...props} />}/>

          <Route exact path="/content/:libraryId/:objectId/custom-contract/logs"
            component={DeployedContractEventsContainer}/>
          <Route exact path="/content-types/:objectId/custom-contract/logs" render={(props) =>
            <DeployedContractEventsContainer libraryId={Fabric.contentSpaceLibraryId} {...props} />}/>

          <Route exact path="/content/:libraryId/:objectId/custom-contract/funds"
            component={DeployedContractFundsFormContainer}/>
          <Route exact path="/content-types/:objectId/custom-contract/funds" render={(props) =>
            <DeployedContractFundsFormContainer libraryId={Fabric.contentSpaceLibraryId} {...props} />}/>

          /* Contracts */

          <Route exact path="/contracts" component={ContractsContainer}/>
          <Route exact path="/contracts/saved" component={ContractsContainer}/>
          <Route exact path="/contracts/deployed" component={ContractsContainer}/>
          <Route exact path="/contracts/compile" component={CompileContractFormContainer}/>
          <Route exact path="/contracts/save" component={ContractFormContainer}/>
          <Route exact path="/contracts/watch" component={WatchContractFormContainer}/>
          <Route exact path="/contracts/deploy" component={DeployContractFormContainer}/>
          <Route exact path="/contracts/deployed/:contractAddress" component={DeployedContractContainer}/>
          <Route exact path="/contracts/deployed/:contractAddress/logs" component={DeployedContractEventsContainer}/>
          <Route exact path="/contracts/deployed/:contractAddress/funds" component={DeployedContractFundsFormContainer}/>
          <Route exact path="/contracts/:contractName" component={ContractContainer}/>
          <Route exact path="/contracts/:contractName/edit" component={ContractFormContainer}/>
          <Route exact path="/contracts/:contractName/deploy" component={DeployContractFormContainer}/>

          /* Logs */
          <Route exact path="/logs" component={LogsContainer} />
        </ConnectedSwitch>
      </div>
    );
  }
}

const RouterContainer = connect(
  (state) => { return {router: state.router, frameRouting: state.frameRouting}; },
  (dispatch) => Thunk(dispatch, [ GetFramePath, StartRouteSynchronization ])
)(Router);

// Wrap the router in an error handler to ensure a crash in the main content does not
// crash the entire app (particularly, the navbar)
export default ErrorHandler(RouterContainer);
