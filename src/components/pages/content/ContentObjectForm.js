import React from "react";
import Path from "path";
import RequestPage from "../RequestPage";
import RequestForm from "../../forms/RequestForm";
import { JsonTextArea } from "../../../utils/Input";

class ContentObjectForm extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      libraryId: this.props.libraryId || this.props.match.params.libraryId,
      objectId: this.props.match.params.objectId,
      name: "",
      description: "",
      type: "",
      metadata: "",
      createForm: this.props.location.pathname.endsWith("create")
    };

    this.PageContent = this.PageContent.bind(this);
    this.FormContent = this.FormContent.bind(this);
    this.HandleInputChange = this.HandleInputChange.bind(this);
    this.HandleSubmit = this.HandleSubmit.bind(this);
    this.RequestComplete = this.RequestComplete.bind(this);
  }

  // Load existing content object on edit
  componentDidMount() {
    if(this.state.createForm) {
      this.setState({
        loadRequestId: this.props.WrapRequest({
          todo: async () => {
            await this.props.ListContentTypes();
          }
        })
      });
    } else {
      this.setState({
        loadRequestId: this.props.WrapRequest({
          todo: async () => {
            await this.props.GetContentObject({
              libraryId: this.state.libraryId,
              objectId: this.state.objectId
            });

            await this.props.ListContentTypes();
          }
        })
      });
    }
  }

  RequestComplete() {
    const types = Object.values(this.props.types).map(type => {
      const typeName = (type.meta && type.meta["eluv.name"]) || type.hash;
      return [typeName, type.hash];
    }).sort();

    types.unshift(
      ["[none]", ""]
    );

    this.setState({
      types,
      type: types[0][1]
    });

    if(!this.state.createForm) {
      let object = this.props.objects[this.state.objectId];

      this.setState({
        name: object.name,
        type: object.type,
        description: object.description,
        metadata: JSON.stringify(object.meta, null, 2),
        isContentLibraryObject: object.isContentLibraryObject
      });
    }
  }

  HandleInputChange(event) {
    this.setState({
      [event.target.name]: event.target.value
    });
  }

  HandleSubmit() {
    if(this.state.createForm) {
      this.setState({
        submitRequestId: this.props.WrapRequest({
          todo: async () => {
            const objectId = await this.props.CreateContentObject({
              libraryId: this.state.libraryId,
              name: this.state.name,
              type: this.state.type,
              description: this.state.description,
              metadata: this.state.metadata
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
              type: this.state.type,
              description: this.state.description,
              metadata: this.state.metadata
            });
          }
        })
      });
    }
  }

  TypeField() {
    const options = this.state.types.map(([name, hash]) => {
      return <option key={"type-" + hash} name="type" value={hash}>{ name }</option>;
    });

    return (
      <div className="labelled-input">
        <label className="label" htmlFor="type">Content Type</label>
        <select name="type" value={this.state.type} onChange={this.HandleInputChange}>
          { options }
        </select>
      </div>
    );
  }

  FormContent() {
    return (
      <div className="form-content">
        <div className="labelled-input">
          <label className="label" htmlFor="name">Name</label>
          <input name="name" value={this.state.name} onChange={this.HandleInputChange} readOnly={this.state.isContentLibraryObject} />
        </div>
        { this.TypeField() }
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
    const legend = this.state.createForm ? "Create content object" : "Update content object";

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

export default ContentObjectForm;
