import React from "react";
import UrlJoin from "url-join";
import Path from "path";
import {Action, AsyncComponent, BrowseWidget, Form, JsonInput} from "elv-components-js";
import {inject, observer} from "mobx-react";

@inject("typeStore")
@observer
class ContentTypeForm extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      createForm: !this.props.typeStore.typeId,
      name: "",
      description: "",
      metadata: "",
      redirectPath: Path.dirname(this.props.match.url)
    };

    this.PageContent = this.PageContent.bind(this);
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
    const Method = this.state.createForm ?
      this.props.typeStore.CreateContentType :
      this.props.typeStore.UpdateContentType;

    const typeId = await Method({
      typeId: this.props.typeStore.typeId,
      name: this.state.name,
      description: this.state.description,
      metadata: this.state.metadata,
      bitcode: this.state.bitcode
    });

    this.setState({
      typeId,
    });
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

  PageContent() {
    const legend = this.state.createForm ? "Create content type" : "Manage content type";

    const backPath = Path.dirname(this.props.match.url);
    const redirectPath = this.state.createForm ? UrlJoin(backPath, this.state.typeId || "") : backPath;

    return (
      <div>
        <div className="actions-container manage-actions">
          <Action type="link" to={Path.dirname(this.props.match.url)} className="secondary">Back</Action>
        </div>
        <Form
          legend={legend}
          redirectPath={redirectPath}
          cancelPath={backPath}
          OnSubmit={this.HandleSubmit}
        >
          <div className="form-content">
            <label htmlFor="name">Name</label>
            <input name="name" value={this.state.name} onChange={this.HandleInputChange} />

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

  render() {
    return (
      <AsyncComponent
        Load={
          async () => {
            if(!this.state.createForm) {
              await this.props.typeStore.ContentType({
                typeId: this.props.typeStore.typeId
              });

              this.setState({
                name: this.props.typeStore.type.name,
                description: this.props.typeStore.type.description,
                metadata: JSON.stringify(this.props.typeStore.type.meta, null, 2)
              });
            }
          }
        }
        render={this.PageContent}
      />
    );
  }
}

export default ContentTypeForm;
