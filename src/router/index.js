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
  ContentLibraryGroupsFormContainer,
  ContentLibraryTypesFormContainer,
  ContentObjectContainer,
  ContentObjectUploadFormContainer,
  ContentObjectAppContainer,
  ContentObjectReviewFormContainer,
  ContentObjectFormContainer,
  ContentTypeFormContainer
} from "../containers/pages/Content";

import {
  CompileContractFormContainer,
  ContractContainer,
  ContractFormContainer,
  ContractsContainer,
  DeployContractFormContainer,
  DeployedContractContainer,
  DeployedContractMethodFormContainer,
  DeployedContractFundsFormContainer,
  WatchContractFormContainer,
  DeployedContractEventsContainer
} from "../containers/pages/Contracts";
import Fabric from "../clients/Fabric";
import ErrorHandler from "./ErrorHandler";
import Redirect from "react-router/es/Redirect";
import connect from "react-redux/es/connect/connect";
import Thunk from "../utils/Thunk";
import {StartRouteSynchronization} from "../actions/Routing";

class Router extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      redirectPath: "",
      pathSynchronized: false
    };
  }

  // If using FrameClient, determine app path specified in url by requesting it from core-js,
  // then redirect to it. After synchronized with initial URL, keep the URL synchronized with
  // app routing changes by signalling RoutingReducer to intercept route changes and send them
  // up to the container.
  componentDidUpdate() {
    if(!this.state.pathSynchronized) {
      if(Fabric.isFrameClient) {
        Fabric.GetFramePath().then(path => {
          if (path !== this.props.router.location.pathname) {
            this.setState({redirectPath: path});
          } else {
            this.setState({
              redirectPath: "",
              pathSynchronized: true
            });

            this.props.StartRouteSynchronization();
          }
        });
      } else {
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
        <Switch>
          <Route exact path="/" component={ContentLibrariesContainer}/>

          <Route exact path="/access-groups" component={AccessGroupsContainer}/>
          <Route exact path="/access-groups/create" component={AccessGroupFormContainer}/>
          <Route exact path="/access-groups/:contractAddress" component={AccessGroupContainer}/>
          <Route exact path="/access-groups/:contractAddress/edit" component={AccessGroupFormContainer}/>
          <Route exact path="/access-groups/:contractAddress/members" component={AccessGroupMembersFormContainer}/>
          <Route exact path="/access-groups/:contractAddress/contract" component={DeployedContractContainer}/>
          <Route exact path="/access-groups/:contractAddress/contract/logs"
            component={DeployedContractEventsContainer}/>
          <Route exact path="/access-groups/:contractAddress/contract/call/:method"
            component={DeployedContractMethodFormContainer}/>
          <Route exact path="/access-groups/:contractAddress/contract/funds"
            component={DeployedContractFundsFormContainer}/>

          <Route exact path="/content" component={ContentLibrariesContainer}/>
          <Route exact path="/content/create" component={ContentLibraryFormContainer}/>

          /**
          * For most content routes, add content-types route corresponding
          * to /content/:contentSpaceLibrary
          */
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

          <Route exact path="/content/:libraryId/:objectId/upload" component={ContentObjectUploadFormContainer}/>
          <Route exact path="/content-types/:objectId/upload" render={(props) =>
            <ContentObjectUploadFormContainer libraryId={Fabric.contentSpaceLibraryId} {...props} />}/>

          <Route exact path="/content/:libraryId/:objectId/app" component={ContentObjectAppContainer}/>
          <Route exact path="/content-types/:objectId/app" render={(props) =>
            <ContentObjectAppContainer libraryId={Fabric.contentSpaceLibraryId} {...props} />}/>

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

          <Route exact path="/content/:libraryId/:objectId/contract/call/:method"
            component={DeployedContractMethodFormContainer}/>
          <Route exact path="/content-types/:objectId/contract/call/:method" render={(props) =>
            <DeployedContractMethodFormContainer libraryId={Fabric.contentSpaceLibraryId} {...props} />}/>

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

          <Route exact path="/content/:libraryId/:objectId/custom-contract/call/:method"
            component={DeployedContractMethodFormContainer}/>
          <Route exact path="/content-types/:objectId/custom-contract/call/:method" render={(props) =>
            <DeployedContractMethodFormContainer libraryId={Fabric.contentSpaceLibraryId} {...props} />}/>

          <Route exact path="/contracts" component={ContractsContainer}/>
          <Route exact path="/contracts/compile" component={CompileContractFormContainer}/>
          <Route exact path="/contracts/save" component={ContractFormContainer}/>
          <Route exact path="/contracts/watch" component={WatchContractFormContainer}/>
          <Route exact path="/contracts/deploy" component={DeployContractFormContainer}/>
          <Route exact path="/contracts/deployed/:contractAddress" component={DeployedContractContainer}/>
          <Route exact path="/contracts/deployed/:contractAddress/logs"
            component={DeployedContractEventsContainer}/>
          <Route exact path="/contracts/deployed/:contractAddress/call/:method"
            component={DeployedContractMethodFormContainer}/>
          <Route exact path="/contracts/deployed/:contractAddress/funds"
            component={DeployedContractFundsFormContainer}/>
          <Route exact path="/contracts/:contractName" component={ContractContainer}/>
          <Route exact path="/contracts/:contractName/edit" component={ContractFormContainer}/>
          <Route exact path="/contracts/:contractName/deploy" component={DeployContractFormContainer}/>
        </Switch>
      </div>
    );
  }
}

const RouterContainer = connect(
  (state) => { return {router: state.router}; },
  (dispatch) => Thunk(dispatch, [ StartRouteSynchronization ])
)(Router);

// Wrap the router in an error handler to ensure a crash in the main content does not
// crash the entire app (particularly, the navbar)
export default ErrorHandler(RouterContainer);
