import React from "react";
import PropTypes from "prop-types";
import Path from "path";
import BrowseWidget from "../../components/BrowseWidget";
import Form from "../../forms/Form";

class ContentObjectPartsForm extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      encrypt: true,
      progress: {}
    };

    this.FormContent = this.FormContent.bind(this);
    this.HandleFileSelect = this.HandleFileSelect.bind(this);
    this.HandleSubmit = this.HandleSubmit.bind(this);
  }

  HandleFileSelect(event) {
    this.setState({
      files: event.target.files,
    });
  }

  async HandleSubmit() {
    const callback = ({uploaded, total, filename}) => {
      this.setState({
        progress: {
          ...this.state.progress,
          [filename]: (uploaded * 100 / total).toFixed(1)
        }}
      );
    };

    await this.props.methods.Submit({
      libraryId: this.props.libraryId,
      objectId: this.props.objectId,
      files: this.state.files,
      encrypt: this.state.encrypt,
      callback
    });
  }

  FormContent() {
    return (
      <div className="form-content">
        <label htmlFor="files" className="align-top">Files</label>
        <BrowseWidget
          name="files"
          onChange={this.HandleFileSelect}
          required={true}
          multiple={true}
          progress={this.state.progress}
        />

        <label htmlFor="encrypt">Encrypt Parts</label>
        <input
          type="checkbox"
          name="encrypt"
          value={this.state.encrypt}
          checked={this.state.encrypt}
          onChange={() => { this.setState({encrypt: !this.state.encrypt}); }}
        />
      </div>
    );
  }

  render() {
    return (
      <Form
        legend="Upload parts"
        formContent={this.FormContent()}
        redirectPath={Path.dirname(this.props.match.url)}
        cancelPath={Path.dirname(this.props.match.url)}
        status={this.props.methodStatus.Submit}
        OnSubmit={this.HandleSubmit}
      />
    );
  }
}

ContentObjectPartsForm.propTypes = {
  libraryId: PropTypes.string.isRequired,
  objectId: PropTypes.string.isRequired,
  methods: PropTypes.shape({
    Submit: PropTypes.func.isRequired
  })
};

export default ContentObjectPartsForm;
