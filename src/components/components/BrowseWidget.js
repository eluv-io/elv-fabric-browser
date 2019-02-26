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
      browseButtonRef: React.createRef(),
      previewUrl: ""
    };

    this.HandleChange = this.HandleChange.bind(this);
  }

  async HandlePreviewChange(file) {
    if(!this.props.preview || !file) { return; }
    const data = await new Response(file).blob();
    return window.URL.createObjectURL(data);
  }

  async HandleChange(event) {
    const name = event.target.name;
    const value = event.target.value;
    const files = event.target.files || [];

    const fileInfo = await FileInfo("/", files, true);

    if(!this.props.directories || fileInfo.length === 0) {
      const previewUrl = await this.HandlePreviewChange(files[0]);

      this.setState({
        dirname: "",
        fileInfo,
        previewUrl
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

    this.props.onChange({
      target: {
        name,
        value,
        files
      }
    });
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

  Preview() {
    if(!this.props.preview || !this.state.previewUrl) { return null; }

    return (
      <div className="image-preview">
        <img src={this.state.previewUrl}/>
      </div>
    );
  }

  render() {
    const inputName = "browse-" + this.props.name;
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
      <div className="browse-widget">
        <input
          hidden={true}
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
        { this.Preview() }
        { this.FileSelections() }
      </div>
    );
  }
}

BrowseWidget.propTypes = {
  name: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  required: PropTypes.bool,
  multiple: PropTypes.bool,
  accept: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.arrayOf(PropTypes.string)
  ]),
  preview: PropTypes.bool,
  directories: PropTypes.bool,
  progress: PropTypes.object
};

export default BrowseWidget;
