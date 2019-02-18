import React from "react";
import PropTypes from "prop-types";
import Path from "path";
import RadioSelect from "../../../components/RadioSelect";
import { PageHeader } from "../../../components/Page";
import Action from "../../../components/Action";
import Form from "../../../forms/Form";

class DeployedContractFundsForm extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      amount: 0,
      direction: "deposit"
    };

    this.HandleSubmit = this.HandleSubmit.bind(this);
    this.HandleInputChange = this.HandleInputChange.bind(this);
  }
  
  HandleInputChange(event) {
    this.setState({
      [event.target.name]: event.target.value
    });
  }

  async HandleSubmit() {
    if(this.state.direction === "deposit") {
      await this.props.methods.SendFunds({
        recipient: this.props.contract.address,
        ether: this.state.amount
      });
    } else {
      await this.props.methods.WithdrawContractFunds({
        contractAddress: this.props.contract.address,
        abi: this.props.contract.abi,
        ether: this.state.amount
      });
    }
  }

  ContractMethodForm() {
    return (
      <div>
        <div className="labelled-input">
          <label>Current Balance</label>
          <span>{this.props.deployedContract.balance}</span>
        </div>
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
    const status = this.state.direction === "deposit" ?
      this.props.methodStatus.SendFunds : this.props.methodStatus.WithdrawContractFunds;

    return (
      <div className="page-container">
        <div className="actions-container">
          <Action type="link" className="secondary" to={Path.dirname(this.props.match.url)}>Back</Action>
        </div>
        <PageHeader header={this.props.contract.name} subHeader={this.props.contract.description} />
        <Form
          legend="Transfer Contract Funds"
          formContent={this.ContractMethodForm()}
          redirectPath={Path.dirname(this.props.match.url)}
          cancelPath={Path.dirname(this.props.match.url)}
          OnSubmit={this.HandleSubmit}
          submitting={status.loading}
          redirect={status.completed}
        />
      </div>
    );
  }
}

DeployedContractFundsForm.propTypes = {
  contract: PropTypes.object.isRequired,
  deployedContracts: PropTypes.object.isRequired,
  methods: PropTypes.shape({
    SendFunds: PropTypes.func.isRequired,
    WithdrawContractFunds: PropTypes.func.isRequired
  })
};

export default DeployedContractFundsForm;
