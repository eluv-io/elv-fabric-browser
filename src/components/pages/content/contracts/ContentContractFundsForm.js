import React from "react";
import Path from "path";
import Fabric from "../../../../clients/Fabric";
import Link from "react-router-dom/es/Link";
import RequestForm from "../../../forms/RequestForm";
import RequestPage from "../../RequestPage";
import RadioSelect from "../../../components/RadioSelect";
import BaseContentContract from "elv-client-js/src/contracts/BaseContent";

class ContentContractFundsForm extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      libraryId: this.props.libraryId || this.props.match.params.libraryId,
      objectId: this.props.match.params.objectId,
      direction: "deposit",
      amount: 0
    };

    this.RequestComplete = this.RequestComplete.bind(this);

    this.HandleSubmit = this.HandleSubmit.bind(this);
    this.HandleInputChange = this.HandleInputChange.bind(this);
    this.HandleError = this.HandleError.bind(this);
  }

  componentDidMount() {
    this.setState({
      loadRequestId: this.props.GetContentObjectMetadata({
        libraryId: this.state.libraryId,
        objectId: this.state.objectId
      })
    });
  }

  RequestComplete() {
    const contentObject = this.props.content.contentObjects[this.state.objectId];

    if(!contentObject) { return null; }

    if(this.state.isCustom) {
      this.setState({
        contract: {
          name: contentObject.metadata.customContract.name,
          description: contentObject.metadata.customContract.description,
          address: contentObject.metadata.customContract.address,
          abi: contentObject.metadata.customContract.abi
        },
        contentObject
      });
    } else {
      this.setState({
        contract: {
          name: "Base Content Contract",
          description: "Base Content Contract",
          address: Fabric.utils.HashToAddress({hash: this.state.objectId}),
          abi: BaseContentContract.abi
        },
        contentObject
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
        submitRequestId: this.props.SendFunds({
          recipient: this.state.contract.address,
          ether: this.state.amount
        })
      });
    } else {
      // Transfer funds from contract
      this.setState({
        submitRequestId: this.props.WithdrawContractFunds({
          contractAddress: this.state.contract.address,
          abi: this.state.contract.abi,
          ether: this.state.amount
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
    )
  }

  PageContent() {
    if(!this.state.contentObject) { return null; }

    return (
      <div className="page-container">
        <div className="actions-container">
          <Link className="action secondary" to={Path.dirname(this.props.match.url)}>Back</Link>
        </div>
        <h3 className="page-header">{ this.state.contentObject.name}</h3>
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
        pageContent={this.PageContent()}
        OnRequestComplete={this.RequestComplete}
      />
    )
  }
}

export default ContentContractFundsForm;
