import React from "react";
import PropTypes from "prop-types";
import Path from "path";
import {Action, Form} from "elv-components-js";

class ContentLibraryGroupForm extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      groupAddress: "",
      accessor: false,
      reviewer: false,
      contributor: false
    };

    this.HandleGroupChange = this.HandleGroupChange.bind(this);
    this.HandleSubmit = this.HandleSubmit.bind(this);
  }

  componentDidMount() {
    const initialGroupAddress = Object.keys(this.props.accessGroups)[0];

    if(!initialGroupAddress) { return; }

    this.HandleGroupChange({target: {value: initialGroupAddress}});
  }

  HandleGroupChange(event) {
    const permissions = this.props.library.groupPermissions[event.target.value] || {};
    this.setState({
      groupAddress: event.target.value,
      accessor: !!permissions.accessor,
      contributor: !!permissions.contributor,
      reviewer: !!permissions.reviewer
    });
  }

  async HandleSubmit() {
    await this.props.methods.Submit({
      groupAddress: this.state.groupAddress,
      accessor: this.state.accessor,
      reviewer: this.state.reviewer,
      contributor: this.state.contributor
    });
  }

  Groups() {
    let options = Object.values(this.props.accessGroups).map(group =>
      <option key={`group-${group.address}`} value={group.address}>{ group.name }</option>
    );

    options = (
      [
        ...options,
        <option key="group-address-other" value="">{"<other>"}</option>
      ]
    );

    return (
      <React.Fragment>
        <label htmlFor="groupAddress">Access Group</label>
        <select name="groupAddress" onChange={this.HandleGroupChange}>
          { options }
        </select>

        <label htmlFor="groupAddress">Address</label>
        <input
          name="groupAddress"
          value={this.state.groupAddress}
          disabled={Object.keys(this.props.accessGroups).includes(this.state.groupAddress)}
          onChange={event => this.setState({groupAddress: event.target.value})}
        />
      </React.Fragment>
    );
  }

  render() {
    let status = {...this.props.methodStatus.Submit};

    const backPath = Path.dirname(this.props.match.url);

    return (
      <div>
        <div className="actions-container manage-actions">
          <Action type="link" to={Path.dirname(this.props.match.url)} className="secondary">Back</Action>
        </div>
        <Form
          legend={`Add access group to '${this.props.library.name}'`}
          redirectPath={backPath}
          cancelPath={backPath}
          status={status}
          OnSubmit={this.HandleSubmit}
        >
          <div className="form-content">
            { this.Groups() }

            <label htmlFor="accessor">Accessor</label>
            <input
              type="checkbox"
              checked={this.state.accessor}
              onChange={() => this.setState({accessor: !this.state.accessor})}
            />

            <label htmlFor="contributor">Contributor</label>
            <input
              type="checkbox"
              checked={this.state.contributor}
              onChange={() => this.setState({contributor: !this.state.contributor})}
            />

            <label htmlFor="reviewer">Reviewer</label>
            <input
              type="checkbox"
              checked={this.state.reviewer}
              onChange={() => this.setState({reviewer: !this.state.reviewer})}
            />
          </div>
        </Form>
      </div>
    );
  }
}

ContentLibraryGroupForm.propTypes = {
  library: PropTypes.object,
  accessGroups: PropTypes.object,
  methods: PropTypes.shape({
    Submit: PropTypes.func.isRequired
  })
};

export default ContentLibraryGroupForm;
