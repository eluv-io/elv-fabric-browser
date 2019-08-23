import React from "react";
import PropTypes from "prop-types";
import Path from "path";
import {Action, BrowseWidget, Form} from "elv-components-js";
import {PageHeader} from "../../components/Page";

class ContentAppForm extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      role: this.props.match.params.role
    };

    this.HandleFileSelect = this.HandleFileSelect.bind(this);
    this.HandleSubmit = this.HandleSubmit.bind(this);
  }

  HandleFileSelect(event) {
    this.setState({
      appFile: event.target.files
    });
  }

  async HandleSubmit() {
    await this.props.methods.Submit({
      libraryId: this.props.libraryId,
      objectId: this.props.objectId,
      role: this.state.role,
      file: this.state.appFile
    });
  }

  render() {
    const header = this.props.object.isContentLibraryObject ?
      this.props.library.name + " > Library Object" :
      this.props.library.name + " > " + this.props.object.name;

    return (
      <div className="page-container contracts-page-container">
        <div className="actions-container">
          <Action type="link" to={Path.dirname(Path.dirname(this.props.match.url))} className="secondary">Back</Action>
        </div>
        <PageHeader header={header} subHeader={`App management - ${this.state.role.capitalize()}`} />
        <div className="page-content">
          <Form
            legend={`Add ${this.state.role.capitalize()} App`}
            redirectPath={Path.dirname(Path.dirname(this.props.match.url))}
            cancelPath={Path.dirname(Path.dirname(this.props.match.url))}
            status={this.props.methodStatus.Submit}
            OnSubmit={this.HandleSubmit}
          >
            <div className="form-content">
              <label htmlFor="app" className="align-top">App</label>
              <BrowseWidget
                name="app"
                onChange={this.HandleFileSelect}
                accept={"text/html"}
                multiple={false}
                required={true}
              />
            </div>
          </Form>
        </div>
      </div>
    );
  }
}

ContentAppForm.propTypes = {
  libraryId: PropTypes.string.isRequired,
  library: PropTypes.object.isRequired,
  objectId: PropTypes.string.isRequired,
  object: PropTypes.object.isRequired,
  methods: PropTypes.shape({
    Submit: PropTypes.func.isRequired
  })
};

export default ContentAppForm;
