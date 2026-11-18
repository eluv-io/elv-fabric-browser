import React from "react";
import Path from "path";
import {PageHeader} from "@/components/Page";
import Events from "@/components/Events";
import {AsyncComponent} from "elv-components-js";
import {observer} from "mobx-react";
import ActionsToolbar from "@/components/ActionsToolbar";

import {contractStore} from "@/stores";
import {eventsStore} from "@/stores";

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
          header={contractStore.contract.name}
          subHeader={contractStore.contract.description}
        />
        <div className="page-content-container">
          <div className="page-content">
            <div className="label-box">
              <div className="contract-events">
                <Events
                  contractAddress={contractStore.contractAddress}
                  abi={contractStore.contract.abi}
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
            await contractStore.DeployedContractInfo();
          }
        }
        render={this.PageContent}
      />
    );
  }
}

export default observer(DeployedContractEvents);
