import React from "react";
import Path from "path";
import {JsonTextArea} from "../../../utils/Input";
import Form from "../../forms/Form";

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
    await this.props.methods.Submit({
      name: this.state.name,
      description: this.state.description,
      address: this.state.address,
      abi: this.state.abi
    });
  }

  FormContent() {
    return (
      <div className="form-content">
        <label htmlFor="name">Name</label>
        <input name="name" value={this.state.name} onChange={this.HandleInputChange} />

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
        <JsonTextArea
          name="abi"
          value={this.state.abi}
          onChange={this.HandleInputChange}
          UpdateValue={formattedAbi => this.setState({abi: formattedAbi})}
        />
      </div>
    );
  }

  render() {
    const redirectPath = Path.join(Path.dirname(this.props.match.url), "deployed", this.state.address);

    return (
      <Form
        legend={"Watch Deployed Contract"}
        formContent={this.FormContent()}
        redirectPath={redirectPath}
        cancelPath={Path.dirname(this.props.match.url)}
        status={this.props.methodStatus.Submit}
        OnSubmit={this.HandleSubmit}
      />
    );
  }
}

export default WatchContractForm;
