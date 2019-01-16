import React from "react";
import Path from "path";
import RequestPage from "../RequestPage";
import RequestForm from "../../forms/RequestForm";
import { JsonTextArea } from "../../../utils/Input";
import BrowseWidget from "../../components/BrowseWidget";

class ContentTypeForm extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      libraryId: this.props.libraryId,
      objectId: this.props.match.params.objectId,
      name: "",
      description: "",
      metadata: "",
      createForm: this.props.location.pathname.endsWith("create")
    };

    this.PageContent = this.PageContent.bind(this);
    this.FormContent = this.FormContent.bind(this);
    this.HandleInputChange = this.HandleInputChange.bind(this);
    this.HandleBitcodeChange = this.HandleBitcodeChange.bind(this);
    this.HandleSubmit = this.HandleSubmit.bind(this);
    this.RequestComplete = this.RequestComplete.bind(this);
  }

  // Load existing content object on edit
  componentDidMount() {
    if(!this.state.createForm) {
      this.setState({
        loadRequestId: this.props.WrapRequest({
          todo: async () => {
            await this.props.GetContentObject({
              libraryId: this.state.libraryId,
              objectId: this.state.objectId
            });

            await this.props.GetContentObjectVersions({
              libraryId: this.state.libraryId,
              objectId: this.state.objectId
            });
          }
        })
      });
    }
  }

  RequestComplete() {
    let object = this.props.objects[this.state.objectId];

    this.setState({
      isContentLibraryObject: object.isContentLibraryObject,
      name: object.name,
      description: object.description,
      metadata: JSON.stringify(object.meta, null, 2),
    });
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

  HandleSubmit() {
    if(this.state.createForm) {
      this.setState({
        submitRequestId: this.props.WrapRequest({
          todo: async () => {
            const objectId = await this.props.CreateContentType({
              name: this.state.name,
              description: this.state.description,
              metadata: this.state.metadata,
              bitcode: this.state.bitcode
            });

            this.setState({objectId});
          }
        })
      });
    } else {
      this.setState({
        submitRequestId: this.props.WrapRequest({
          todo: async () => {
            await this.props.UpdateContentObject({
              libraryId: this.state.libraryId,
              objectId: this.state.objectId,
              name: this.state.name,
              description: this.state.description,
              metadata: this.state.metadata
            });
          }
        })
      });
    }
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

  PageContent() {
    const legend = this.state.createForm ? "Create content type" : "Manage content type";

    let redirectPath = Path.dirname(this.props.match.url);
    if(this.state.createForm) {
      // On creation, objectId won't exist until submission
      redirectPath = this.state.objectId ?
        Path.join(Path.dirname(this.props.match.url), this.state.objectId) : Path.dirname(this.props.match.url);
    }

    return (
      <RequestForm
        requests={this.props.requests}
        requestId={this.state.submitRequestId}
        legend={legend}
        formContent={this.FormContent()}
        redirectPath={redirectPath}
        cancelPath={Path.dirname(this.props.match.url)}
        OnSubmit={this.HandleSubmit}
      />
    );
  }

  render() {
    if(this.state.createForm) {
      return this.PageContent();
    } else {
      return (
        <RequestPage
          requestId={this.state.loadRequestId}
          requests={this.props.requests}
          pageContent={this.PageContent}
          OnRequestComplete={this.RequestComplete}
        />
      );
    }
  }
}

export default ContentTypeForm;
