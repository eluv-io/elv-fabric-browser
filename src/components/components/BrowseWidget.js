import React from "react";
import PropTypes from "prop-types";
import PrettyBytes from "pretty-bytes";

// A styled browse widget for forms
class BrowseWidget extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      files: "",
      browseButtonRef: React.createRef()
    };

    this.HandleChange = this.HandleChange.bind(this);
  }

  HandleChange(event) {
    const files = Array.from(event.target.files).map(file => {
      return { name: file.name, size: file.size };
    });

    this.setState({
      files: files
    });

    this.props.onChange(event);
  }

  FileSelections() {
    if(!this.state.files) { return null; }

    const selectedFiles = this.state.files.map(file =>
      <div className="selected-file" key={file.name}>
        <span className="filename">{file.name}</span>
        <span className="file-size">{PrettyBytes(file.size)}</span>
      </div>
    );

    return (
      <div className="selected-files">
        { selectedFiles }
      </div>
    );
  }

  render() {
    const inputName = "browse-" + this.props.label;
    const accept = Array.isArray(this.props.accept) ? this.props.accept.join(", ") : this.props.accept;

    return (
      <div className="labelled-input">
        <label className="textarea-label" htmlFor={inputName}>{ this.props.label }</label>
        <div className="browse-widget">
          <div className="actions-container">
            <input
              className="browse-button"
              ref={this.state.browseButtonRef}
              name={inputName}
              type="file"
              required={this.props.required}
              multiple={this.props.multiple}
              accept={accept}
              onChange={this.HandleChange}
            />
            <button
              className="action action-compact action-full-width"
              type="button"
              onClick={() => {this.state.browseButtonRef.current.click();}}
            >
              Browse
            </button>
          </div>
          { this.FileSelections() }
        </div>
      </div>
    );
  }
}

BrowseWidget.propTypes = {
  label: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  required: PropTypes.bool,
  multiple: PropTypes.bool,
  accept: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.arrayOf(PropTypes.string)
  ])
};

export default BrowseWidget;
