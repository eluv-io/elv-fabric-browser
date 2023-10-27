import React from "react";
import Path from "path";
import {Form} from "elv-components-js";
import {inject, observer} from "mobx-react";
import {AsyncComponent} from "elv-components-js";
import ActionsToolbar from "../../components/ActionsToolbar";

@inject("groupStore")
@observer
class AccessGroupMemberForm extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      memberAddress: "",
      manager: false
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
    await this.props.groupStore.AddAccessGroupMember({
      contractAddress: this.props.groupStore.contractAddress,
      memberAddress: this.state.memberAddress,
      manager: this.state.manager
    });
  }

  PageContent() {
    const backPath = Path.dirname(this.props.match.url);

    return (
      <div className="page-container">
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
        <Form
          legend={`Add member to '${this.props.groupStore.accessGroup.name}'`}
          redirectPath={backPath}
          cancelPath={backPath}
          OnSubmit={this.HandleSubmit}
          className="small-form form-page"
        >
          <div className="form-content">
            <label htmlFor="memberAddress">Address</label>
            <input name="memberAddress" value={this.state.memberAddress} onChange={this.HandleInputChange} />

            {
              this.props.groupStore.accessGroup.isOwner &&
              <>
                <label htmlFor="manager">Manager</label>
                <input
                  type="checkbox"
                  name="manager"
                  value={this.state.manager}
                  onChange={() => this.setState({manager: !this.state.manager})}
                />
              </>
            }
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
            await this.props.groupStore.AccessGroup({contractAddress: this.props.groupStore.contractAddress});
          }
        }
        render={this.PageContent}
      />
    );
  }
}

export default AccessGroupMemberForm;
