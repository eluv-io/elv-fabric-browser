import React from "react";
import Path from "path";
import {PageHeader} from "../../../components/Page";
import Events from "../../../components/Events";
import {AsyncComponent} from "elv-components-js";
import {inject, observer} from "mobx-react";
import ActionsToolbar from "../../../components/ActionsToolbar";

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
        <ActionsToolbar
          showContentLookup={false}
          actions={[
            {
              label: "Back",
              type: "link",
              path: Path.dirname(this.props.match.url),
              className: "secondary"
            }
          ]}
        />
        <PageHeader
          header={this.props.contractStore.contract.name}
          subHeader={this.props.contractStore.contract.description}
        />
        <div className="page-content-container">
          <div className="page-content">
            <div className="label-box">
              <div className="contract-events">
                <Events
                  contractAddress={this.props.contractStore.contractAddress}
                  abi={this.props.contractStore.contract.abi}
                />
              </div>
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
            await this.props.contractStore.DeployedContractInfo();
          }
        }
        render={this.PageContent}
      />
    );
  }
}

export default DeployedContractEvents;
