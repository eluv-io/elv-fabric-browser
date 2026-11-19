import React from "react";
import Path from "path";
import {Confirm, Form} from "elv-components-js";
import {observer} from "mobx-react";
import {AsyncComponent} from "elv-components-js";
import ActionsToolbar from "@/components/ActionsToolbar";
import {groupStore} from "@/stores";

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
    if(!(await groupStore.IsSameTenant({userAddress: this.state.memberAddress}))) {
      let rejected = false;
      await Confirm({
        message: "Warning: This user is associated with a different tenancy. Are you sure you want to add them to this group?",
        onCancel: () => { rejected = true; }
      });

      if(rejected) {
        throw "Warning: This user is associated with a different tenancy";
      }
    }

    await groupStore.AddAccessGroupMember({
      contractAddress: groupStore.contractAddress,
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
          legend={`Add member to '${groupStore.accessGroup.name}'`}
          redirectPath={backPath}
          cancelPath={backPath}
          OnSubmit={this.HandleSubmit}
          className="small-form form-page"
        >
          <div className="form-content">
            <label htmlFor="memberAddress">Address</label>
            <input name="memberAddress" value={this.state.memberAddress} onChange={this.HandleInputChange} />

            {
              groupStore.accessGroup.isOwner &&
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
            await groupStore.AccessGroup({contractAddress: groupStore.contractAddress});
          }
        }
        render={this.PageContent}
      />
    );
  }
}

export default observer(AccessGroupMemberForm);
