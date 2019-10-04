import React from "react";
import Path from "path";
import {PageHeader} from "../../../components/Page";
import Events from "../../../components/Events";
import {Action, AsyncComponent} from "elv-components-js";
import {inject, observer} from "mobx-react";

@inject("contractStore")
@inject("eventsStore")
@observer
class DeployedContractEvents extends React.Component {
  constructor(props) {
    super(props);

    this.PageContent = this.PageContent.bind(this);
  }

  PageContent() {
    return (
      <div className="page-container contracts-page-container">
        <div className="actions-container">
          <Action type="link" to={Path.dirname(this.props.match.url)} className="secondary">
            Back
          </Action>
        </div>
        <PageHeader
          header={this.state.contract.name}
          subHeader={this.state.contract.description}
        />
        <div className="page-content">
          <div className="label-box">
            <div className="contract-events">
              <Events
                contractAddress={this.state.contract.contractAddress}
                abi={this.state.contract.abi}
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  render() {
    return (
      <AsyncComponent
        Load={
          async () => {
            this.setState({
              contract: await this.props.contractStore.DeployedContractInfo()
            });
          }
        }
        render={this.PageContent}
      />
    );
  }
}

export default DeployedContractEvents;
