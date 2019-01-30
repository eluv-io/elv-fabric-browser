import React from "react";
import Path from "path";
import RequestForm from "../../../forms/RequestForm";
import RadioSelect from "../../../components/RadioSelect";
import DeployedContractWrapper from "./DeployedContractWrapper";
import PropTypes from "prop-types";
import { PageHeader } from "../../../components/Page";
import Action from "../../../components/Action";

class DeployedContractFundsForm extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      amount: 0,
      direction: "deposit"
    };

    this.HandleSubmit = this.HandleSubmit.bind(this);
    this.HandleInputChange = this.HandleInputChange.bind(this);
    this.HandleError = this.HandleError.bind(this);
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
              recipient: this.props.contract.address,
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
              contractAddress: this.props.contract.address,
              abi: this.props.contract.abi,
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

  render() {
    return (
      <div className="page-container">
        <div className="actions-container">
          <Action type="link" className="secondary" to={Path.dirname(this.props.match.url)}>Back</Action>
        </div>
        <PageHeader header={this.props.contract.name} subHeader={this.props.contract.description} />
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
}

DeployedContractFundsForm.propTypes = {
  contract: PropTypes.object.isRequired
};

export default DeployedContractWrapper(DeployedContractFundsForm);
