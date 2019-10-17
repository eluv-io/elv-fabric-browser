import React from "react";
import UrlJoin from "url-join";
import Path from "path";
import {Action, Form} from "elv-components-js";
import {inject, observer} from "mobx-react";
import AsyncComponent from "../../components/AsyncComponent";

@inject("groupStore")
@observer
class AccessGroupForm extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      createForm: !props.groupStore.contractAddress,
      name: "",
      description: "",
    };

    this.PageContent = this.PageContent.bind(this);
    this.HandleInputChange = this.HandleInputChange.bind(this);
    this.HandleSubmit = this.HandleSubmit.bind(this);
  }

  HandleInputChange(event) {
    this.setState({
      [event.target.name]: event.target.value
    });
  }

  async HandleSubmit() {
    const contractAddress = await this.props.groupStore.SaveAccessGroup({
      address: this.props.groupStore.contractAddress,
      name: this.state.name,
      description: this.state.description,
    });

    this.setState({
      contractAddress,
    });
  }

  PageContent() {
    const backPath = Path.dirname(this.props.match.url);
    const redirectPath = this.state.createForm ? UrlJoin(backPath, this.state.contractAddress || "") : backPath;

    return (
      <div>
        <div className="actions-container manage-actions">
          <Action type="link" to={Path.dirname(this.props.match.url)} className="secondary">Back</Action>
        </div>
        <Form
          legend={this.state.createForm ? "Create Access Group" : "Manage Access Group"}
          redirectPath={redirectPath}
          cancelPath={backPath}
          OnSubmit={this.HandleSubmit}
        >
          <div className="form-content">
            <label htmlFor="name">Name</label>
            <input name="name" value={this.state.name} onChange={this.HandleInputChange} />

            <label htmlFor="description" className="align-top">Description</label>
            <textarea name="description" value={this.state.description} onChange={this.HandleInputChange} />
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
            if(!this.state.createForm) {
              await this.props.groupStore.AccessGroup({
                contractAddress: this.props.groupStore.contractAddress
              });

              this.setState({
                name: this.props.groupStore.accessGroup.name,
                description: this.props.groupStore.accessGroup.description,
              });
            }
          }
        }
        render={this.PageContent}
      />
    );
  }
}

export default AccessGroupForm;
