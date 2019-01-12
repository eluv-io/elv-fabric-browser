import React from "react";
import PropTypes from "prop-types";
import PrettyBytes from "pretty-bytes";
import DirectoryIcon from "../../static/icons/directory.svg";
import FileIcon from "../../static/icons/file.svg";
import {FileInfo} from "../../utils/Files";
import InlineSVG from "svg-inline-react";
import Path from "path";

// A styled browse widget for forms
class BrowseWidget extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      fileInfo: "",
      browseButtonRef: React.createRef()
    };

    this.HandleChange = this.HandleChange.bind(this);
  }

  HandleChange(event) {
    FileInfo("/", event.target.files, true).then(fileInfo => {
      if(!this.props.directories || fileInfo.length === 0) {
        this.setState({
          dirname: "",
          fileInfo
        });
      } else {
        // Format file info:
        // Directory information must be determined by looking at file paths
        // Only display top level directories
        let dirname = "";
        const files = {};
        fileInfo.forEach(file => {
          const path = file.path.replace(/^\/+/g, "");
          const parts = path.split(Path.sep);

          if(!dirname) { dirname = parts[0]; }

          if(parts.length > 2) {
            const dirInfo = files[parts[1]] || {};
            files[parts[1]] = {
              path: parts[1],
              type: "directory",
              size: (dirInfo.size || 0) + file.size
            };
          } else {
            files[parts[1]] = {
              ...file,
              path: parts[1]
            };
          }
        });

        this.setState({
          dirname,
          fileInfo: Object.values(files)
        });
      }


    });

    this.props.onChange(event);
  }

  ItemRow(item) {
    return (
      <tr className="item-icon" key={item.path}>
        <td>
          <InlineSVG className="icon dark" src={item.type === "directory" ? DirectoryIcon : FileIcon} />
        </td>
        <td className="item-path">
          { item.path }
        </td>
        <td>
          { PrettyBytes(item.size || 0) }
        </td>
      </tr>
    );
  }

  FileSelections() {
    if(!this.state.fileInfo) { return null; }

    return (
      <div className="browse-widget-files">
        <table>
          <thead>
            <tr>
              <th className="type-header" />
              <th>Name</th>
              <th>Size</th>
            </tr>
          </thead>
          <tbody>
            {
              this.state.fileInfo
                .sort((item1, item2) => {
                  if(item1.type !== item2.type) {
                    if(item1.type === "directory") {
                      return -1;
                    } else {
                      return 1;
                    }
                  } else {
                    return item1.path.toLowerCase() > item2.path.toLowerCase();
                  }
                })
                .map(file => this.ItemRow(file))
            }
          </tbody>
        </table>
      </div>
    );
  }

  render() {
    const inputName = "browse-" + this.props.label;
    const accept = Array.isArray(this.props.accept) ? this.props.accept.join(", ") : this.props.accept;
    let directoryAttributes = {};
    if(this.props.directories) {
      directoryAttributes = {
        webkitdirectory: "true",
        mozdirectory: "true",
        msdirectory: "true",
        odirectory: "true",
        directory: "true"
      };
    }

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
              {...directoryAttributes}
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
  ]),
  directories: PropTypes.bool
};

export default BrowseWidget;
