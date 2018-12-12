import React from "react";
import Path from "path";
import Fabric from "../../../../clients/Fabric";
import Link from "react-router-dom/es/Link";
import RequestForm from "../../../forms/RequestForm";
import RequestPage from "../../RequestPage";
import RadioSelect from "../../../components/RadioSelect";
import BaseContentContract from "elv-client-js/src/contracts/BaseContent";

class DeployedContractFundsForm extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      libraryId: this.props.libraryId || this.props.match.params.libraryId,
      objectId: this.props.match.params.objectId,
      contractAddress: this.props.match.params.contractAddress,
      // If object ID exists in route, this form is for deploying a custom content object contract
      isContentObjectContract: (!!this.props.match.params.objectId),
      direction: "deposit",
      amount: 0,
      isCustom: this.props.location.pathname.includes("custom-contract")
    };

    this.PageContent = this.PageContent.bind(this);
    this.RequestComplete = this.RequestComplete.bind(this);
    this.HandleSubmit = this.HandleSubmit.bind(this);
    this.HandleInputChange = this.HandleInputChange.bind(this);
    this.HandleError = this.HandleError.bind(this);
  }

  componentDidMount() {
    if(this.state.isContentObjectContract) {
      this.setState({
        loadRequestId: this.props.WrapRequest({
          todo: async () => {
            await this.props.GetContentObject({
              libraryId: this.state.libraryId,
              objectId: this.state.objectId
            });
          }
        })
      });
    } else {
      this.setState({
        loadRequestId: this.props.WrapRequest({
          todo: async () => {
            await this.props.ListDeployedContracts();
          }
        })
      });
    }
  }

  RequestComplete() {
    if(this.state.isContentObjectContract) {
      const object = this.props.content.objects[this.state.objectId];

      if (!object) {
        return null;
      }

      if (this.state.isCustom) {
        this.setState({
          contract: {
            name: object.meta.customContract.name,
            description: object.meta.customContract.description,
            address: object.meta.customContract.address,
            abi: object.meta.customContract.abi
          },
          object
        });
      } else {
        this.setState({
          contract: {
            name: "Base Content Contract",
            description: "Base Content Contract",
            address: Fabric.utils.HashToAddress({hash: this.state.objectId}),
            abi: BaseContentContract.abi
          },
          object
        });
      }
    } else {
      this.setState({
        contract: this.props.deployedContracts[this.state.contractAddress]
      });
    }
  }

  HandleInputChange(event) {
    this.setState({
      [event.target.name]: event.target.value
    });
  }

  HandleSubmit() {
    if(this.state.direction === "deposit") {
      // Send funds to contract
      this.setState({
        submitRequestId: this.props.WrapRequest({
          todo: async () => {
            await this.props.SendFunds({
              recipient: this.state.contract.address,
              ether: this.state.amount
            });
          }
        })
      });
    } else {
      // Transfer funds from contract
      this.setState({
        submitRequestId: this.props.WrapRequest({
          todo: async () => {
            await this.props.WithdrawContractFunds({
              contractAddress: this.state.contract.address,
              abi: this.state.contract.abi,
              ether: this.state.amount
            });
          }
        })
      });
    }
  }

  HandleError() {
    this.setState({
      submitRequestId: undefined
    });
  }

  ContractMethodForm() {
    return (
      <div>
        <RadioSelect
          name="direction"
          label="Action"
          options={[["Deposit", "deposit"], ["Withdraw", "withdraw"]]}
          selected={this.state.direction}
          onChange={this.HandleInputChange}
        />
        <div className="labelled-input">
          <label htmlFor="amount">Amount</label>
          <input name="amount" type="number" step={0.0000000001} value={this.state.amount} onChange={this.HandleInputChange} />
        </div>
      </div>
    );
  }

  PageContent() {
    return (
      <div className="page-container">
        <div className="actions-container">
          <Link className="action secondary" to={Path.dirname(this.props.match.url)}>Back</Link>
        </div>
        <h3 className="page-header">
          { this.state.isContentObjectContract ? this.state.object.name : "Deployed Contract" }
        </h3>
        <RequestForm
          requests={this.props.requests}
          requestId={this.state.submitRequestId}
          legend="Transfer Contract Funds"
          formContent={this.ContractMethodForm()}
          redirectPath={Path.dirname(this.props.match.url)}
          cancelPath={Path.dirname(this.props.match.url)}
          OnSubmit={this.HandleSubmit}
          OnError={this.HandleError}
        />
      </div>
    );
  }

  render() {
    return (
      <RequestPage
        requests={this.props.requests}
        requestId={this.state.loadRequestId}
        pageContent={this.PageContent}
        OnRequestComplete={this.RequestComplete}
      />
    );
  }
}

export default DeployedContractFundsForm;
