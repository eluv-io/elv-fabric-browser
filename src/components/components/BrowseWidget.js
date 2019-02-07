import React from "react";
import PropTypes from "prop-types";
import PrettyBytes from "pretty-bytes";
import DirectoryIcon from "../../static/icons/directory.svg";
import FileIcon from "../../static/icons/file.svg";
import {FileInfo} from "../../utils/Files";
import Path from "path";
import {Icon} from "./Icons";
import Action from "./Action";

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
          const parts = file.path.split(Path.sep);

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
    const info = this.props.progress &&  this.props.progress[item.path] ?
      `${this.props.progress[item.path]}%` : PrettyBytes(item.size || 0);
    return (
      <tr className="item-icon" key={item.path}>
        <td>
          <Icon src={item.type === "directory" ? DirectoryIcon : FileIcon} />
        </td>
        <td className="item-path">
          { item.path }
        </td>
        <td>
          { info }
        </td>
      </tr>
    );
  }

  // Sort items - directory first, then case-insensitive alphabetical order
  SortedItems() {
    return (
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
              <th className="size-header" />
            </tr>
          </thead>
          <tbody>
            { this.SortedItems() }
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
            <Action
              className="action-compact action-full-width"
              onClick={() => this.state.browseButtonRef.current.click()}
            >
              Browse
            </Action>
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
  directories: PropTypes.bool,
  progress: PropTypes.object
};

export default BrowseWidget;
