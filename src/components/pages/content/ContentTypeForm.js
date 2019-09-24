import React from "react";
import PropTypes from "prop-types";
import UrlJoin from "url-join";
import Path from "path";
import {Action, BrowseWidget, Form, JsonInput} from "elv-components-js";

class ContentTypeForm extends React.Component {
  constructor(props) {
    super(props);

    const object = props.object || {};

    this.state = {
      name: object.name || "",
      description: object.description || "",
      metadata: JSON.stringify(object.meta, null, 2),
      isContentLibraryObject: object.isContentLibraryObject || false,
      redirectPath: Path.dirname(this.props.match.url)
    };

    this.HandleInputChange = this.HandleInputChange.bind(this);
    this.HandleBitcodeChange = this.HandleBitcodeChange.bind(this);
    this.HandleSubmit = this.HandleSubmit.bind(this);
  }

  HandleInputChange(event) {
    this.setState({
      [event.target.name]: event.target.value
    });
  }

  HandleBitcodeChange(event) {
    this.setState({
      bitcode: event.target.files[0]
    });
  }

  async HandleSubmit() {
    const objectId = await this.props.methods.Submit({
      libraryId: this.props.libraryId,
      objectId: this.props.objectId,
      name: this.state.name,
      description: this.state.description,
      metadata: this.state.metadata,
      bitcode: this.state.bitcode
    });

    this.setState({objectId});
  }

  BitcodeSelection() {
    return [
      <label key="bitcode-selection-label" htmlFor="bitcode">Bitcode</label>,
      <BrowseWidget
        key="bitcode-selection"
        name="bitcode"
        required={false}
        multiple={false}
        accept=".bc"
        onChange={this.HandleBitcodeChange}
      />
    ];
  }

  render() {
    const legend = this.props.createForm ? "Create content type" : "Manage content type";

    let status = {...this.props.methodStatus.Submit};
    status.completed = status.completed && !!this.state.objectId;

    const backPath = Path.dirname(this.props.match.url);
    const redirectPath = this.props.createForm ? UrlJoin(backPath, this.state.objectId || "") : backPath;

    return (
      <div>
        <div className="actions-container manage-actions">
          <Action type="link" to={Path.dirname(this.props.match.url)} className="secondary">Back</Action>
        </div>
        <Form
          legend={legend}
          redirectPath={redirectPath}
          cancelPath={backPath}
          status={status}
          OnSubmit={this.HandleSubmit}
        >
          <div className="form-content">
            <label htmlFor="name">Name</label>
            <input name="name" value={this.state.name} onChange={this.HandleInputChange} readOnly={this.state.isContentLibraryObject} />

            { this.BitcodeSelection() }

            <label className="align-top" htmlFor="description">Description</label>
            <textarea name="description" value={this.state.description} onChange={this.HandleInputChange} />

            <label className="align-top" htmlFor="metadata">Metadata</label>
            <JsonInput
              name={"metadata"}
              value={this.state.metadata}
              onChange={this.HandleInputChange}
            />
          </div>
        </Form>
      </div>
    );
  }
}

ContentTypeForm.propTypes = {
  libraryId: PropTypes.string.isRequired,
  objectId: PropTypes.string,
  object: PropTypes.object,
  createForm: PropTypes.bool.isRequired,
  methods: PropTypes.shape({
    Submit: PropTypes.func.isRequired
  })
};

export default ContentTypeForm;
