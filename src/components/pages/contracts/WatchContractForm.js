import React from "react";
import Path from "path";
import RequestForm from "../../forms/RequestForm";
import {JsonTextArea} from "../../../utils/Input";

class WatchContractForm extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      name: "",
      description: "",
      abi: "",
      address: "",
      submitRequestId: undefined
    };

    this.HandleInputChange = this.HandleInputChange.bind(this);
    this.HandleSubmit = this.HandleSubmit.bind(this);
  }

  HandleInputChange(event) {
    this.setState({
      [event.target.name]: event.target.value
    });
  }

  HandleSubmit() {
    this.setState({
      submitRequestId: this.props.WrapRequest({
        todo: async () => {
          await this.props.WatchContract({
            name: this.state.name,
            description: this.state.description,
            address: this.state.address,
            abi: this.state.abi
          });
        }
      })
    });
  }

  FormContent() {
    return (
      <div className="contracts-form-data">
        <div className="labelled-input">
          <label className="label" htmlFor="name">Name</label>
          <input name="name" value={this.state.name} onChange={this.HandleInputChange} />
        </div>
        <div className="labelled-input">
          <label className="label" htmlFor="address">Address</label>
          <input
            name="address"
            value={this.state.address}
            required={true}
            placeholder="0x0000000000000000000000000000000000000000"
            onChange={this.HandleInputChange}
          />
        </div>
        <div className="labelled-input">
          <label className="label textarea-label" htmlFor="description">Description</label>
          <textarea name="description" value={this.state.description} onChange={this.HandleInputChange} />
        </div>
        <div className="labelled-input">
          <label className="label textarea-label" htmlFor="abi">ABI</label>
          <JsonTextArea
            name="abi"
            value={this.state.abi}
            onChange={this.HandleInputChange}
            UpdateValue={formattedAbi => this.setState({abi: formattedAbi})}
          />
        </div>
      </div>
    );
  }

  render() {
    const redirectPath = Path.join(Path.dirname(this.props.match.url), "deployed", this.state.address);

    return (
      <RequestForm
        requests={this.props.requests}
        requestId={this.state.submitRequestId}
        legend={"Watch Deployed Contract"}
        formContent={this.FormContent()}
        redirectPath={redirectPath}
        cancelPath={Path.dirname(this.props.match.url)}
        OnSubmit={this.HandleSubmit}
      />
    );
  }
}

export default WatchContractForm;
