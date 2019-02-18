import React from "react";
import PropTypes from "prop-types";
import Path from "path";
import { JsonTextArea } from "../../../utils/Input";
import BrowseWidget from "../../components/BrowseWidget";
import Form from "../../forms/Form";

class ContentTypeForm extends React.Component {
  constructor(props) {
    super(props);

    const object = props.object || {};

    this.state = {
      name: object.name || "",
      description: object.description || "",
      metadata: JSON.stringify(object.meta, null, 2),
      isContentLibraryObject: object.isContentLibraryObject || false
    };

    this.FormContent = this.FormContent.bind(this);
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
    if(!this.state.createForm) { return null; }

    return (
      <BrowseWidget
        label="Bitcode"
        required={false}
        multiple={false}
        accept=".bc"
        onChange={this.HandleBitcodeChange}
      />
    );
  }

  FormContent() {
    return (
      <div className="form-content">
        <div className="labelled-input">
          <label className="label" htmlFor="name">Name</label>
          <input name="name" value={this.state.name} onChange={this.HandleInputChange} readOnly={this.state.isContentLibraryObject} />
        </div>
        { this.BitcodeSelection() }
        <div className="labelled-input">
          <label className="textarea-label" htmlFor="description">Description</label>
          <textarea name="description" value={this.state.description} onChange={this.HandleInputChange} />
        </div>
        <div className="labelled-input">
          <label className="textarea-label" htmlFor="metadata">Metadata</label>
          <JsonTextArea
            name={"metadata"}
            value={this.state.metadata}
            onChange={this.HandleInputChange}
            UpdateValue={formattedMetadata => this.setState({metadata: formattedMetadata})}
          />
        </div>
      </div>
    );
  }

  render() {
    // On creation, objectId won't exist until submission - don't submit until objectId determined
    const objectId = this.props.objectId || this.state.objectId;
    const submitted = this.props.methodStatus.Submit.completed && objectId;
    const legend = this.props.createForm ? "Create content type" : "Manage content type";

    let redirectPath = Path.dirname(this.props.match.url);
    if(this.props.createForm) {
      redirectPath = objectId ?
        Path.join(Path.dirname(this.props.match.url), objectId) : Path.dirname(this.props.match.url);
    }

    return (
      <Form
        legend={legend}
        formContent={this.FormContent()}
        redirect={submitted}
        redirectPath={redirectPath}
        cancelPath={redirectPath}
        OnSubmit={this.HandleSubmit}
        submitting={this.props.methodStatus.Submit.loading}
      />
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
