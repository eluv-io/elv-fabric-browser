import React from "react";
import Path from "path";
import {Action, Form} from "elv-components-js";
import AsyncComponent from "../../../components/AsyncComponent";
import {PageHeader} from "../../../components/Page";
import {inject, observer} from "mobx-react";

@inject("contractStore")
@observer
class DeployedContractFundsForm extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      amount: 0
    };

    this.PageContent = this.PageContent.bind(this);
    this.HandleSubmit = this.HandleSubmit.bind(this);
    this.HandleInputChange = this.HandleInputChange.bind(this);
  }

  HandleInputChange(event) {
    this.setState({
      [event.target.name]: event.target.value
    });
  }

  async HandleSubmit() {
    await this.props.contractStore.SendFunds({
      recipient: this.state.contract.contractAddress,
      ether: this.state.amount
    });
  }

  PageContent() {
    return (
      <div className="page-container">
        <div className="actions-container">
          <Action type="link" className="secondary" to={Path.dirname(this.props.match.url)}>Back</Action>
        </div>
        <PageHeader header={this.state.contract.name} subHeader={this.state.contract.description} />
        <Form
          legend="Transfer Contract Funds"
          redirectPath={Path.dirname(this.props.match.url)}
          cancelPath={Path.dirname(this.props.match.url)}
          OnSubmit={this.HandleSubmit}
          className="small-form"
        >
          <div className="form-content">
            <label>Current Balance</label>
            <span>{this.state.contract.balance}</span>

            <label htmlFor="amount">Amount</label>
            <input name="amount" type="number" step={0.0000000001} value={this.state.amount} onChange={this.HandleInputChange} />
          </div>
        </Form>
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

export default DeployedContractFundsForm;
