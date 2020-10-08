import React from "react";
import UrlJoin from "url-join";
import Path from "path";
import {Action, Form, JsonInput} from "elv-components-js";
import {inject, observer} from "mobx-react";

@inject("contractStore")
@observer
class WatchContractForm extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      name: "",
      description: "",
      abi: "",
      address: ""
    };

    this.HandleInputChange = this.HandleInputChange.bind(this);
    this.HandleSubmit = this.HandleSubmit.bind(this);
  }

  HandleInputChange(event) {
    this.setState({
      [event.target.name]: event.target.value
    });
  }

  async HandleSubmit() {
    await this.props.contractStore.WatchContract({
      name: this.state.name,
      description: this.state.description,
      address: this.state.address,
      abi: this.state.abi
    });
  }

  render() {
    const redirectPath = UrlJoin(Path.dirname(this.props.match.url), "deployed", this.state.address);

    return (
      <div className="page-container">
        <div className="actions-container manage-actions">
          <Action type="link" to={Path.dirname(this.props.match.url)} className="secondary">Back</Action>
        </div>
        <Form
          legend={"Watch Deployed Contract"}
          redirectPath={redirectPath}
          cancelPath={Path.dirname(this.props.match.url)}
          OnSubmit={this.HandleSubmit}
        >
          <div className="form-content">
            <label htmlFor="name">Name</label>
            <input name="name" value={this.state.name} required={true} onChange={this.HandleInputChange} />

            <label htmlFor="address">Address</label>
            <input
              name="address"
              value={this.state.address}
              required={true}
              placeholder="0x0000000000000000000000000000000000000000"
              onChange={this.HandleInputChange}
            />

            <label className="align-top" htmlFor="description">Description</label>
            <textarea name="description" value={this.state.description} onChange={this.HandleInputChange} />

            <label className="align-top" htmlFor="abi">ABI</label>
            <JsonInput
              name="abi"
              value={this.state.abi}
              required={true}
              onChange={this.HandleInputChange}
            />
          </div>
        </Form>
      </div>
    );
  }
}

export default WatchContractForm;
