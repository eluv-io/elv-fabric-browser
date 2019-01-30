import React from "react";
import PropTypes from "prop-types";
import PrettyBytes from "pretty-bytes";
import Path from "path";
import { SafeTraverse } from "../../utils/Helpers";

import DirectoryIcon from "../../static/icons/directory.svg";
import FileIcon from "../../static/icons/file.svg";
import DownloadIcon from "../../static/icons/download.svg";
import UploadIcon from "../../static/icons/upload.svg";
import BackIcon from "../../static/icons/directory_back.svg";
import Modal from "../modals/Modal";
import UploadWidget from "./UploadWidget";
import {Icon, IconButton} from "./Icons";

class FileBrowser extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      path: ".",
      displayPath: "/",
      currentDir: this.props.files,
      showUpload: false
    };
  }

  ChangeDirectory(dirname) {
    dirname = Path.normalize(dirname);
    const currentDir = dirname === "." ? this.props.files : SafeTraverse(this.props.files, dirname.split(Path.sep));

    this.setState({
      path: dirname,
      displayPath: dirname === "." ? "/" : "/" + dirname,
      currentDir
    });
  }

  File(name, info) {
    const size = PrettyBytes(info.size || 0);
    return (
      <tr key={`entry-${this.state.path}-${name}`}>
        <td className="item-icon">
          <Icon src={FileIcon} title="File" />
        </td>
        <td title={name} tabIndex="0">{ name }</td>
        <td title={size} tabIndex="0">{ size }</td>
        <td>
          <IconButton
            src={DownloadIcon}
            title={"Download " + name}
            onClick={() => this.props.Download(Path.join(this.state.path, name))}
          />
        </td>
      </tr>
    );
  }

  Directory(name) {
    const changeDirectory = () => this.ChangeDirectory(Path.join(this.state.path, name));
    return (
      <tr key={`entry-${this.state.path}-${name}`} className="clickable" onClick={changeDirectory} onKeyPress={changeDirectory}>
        <td className="item-icon">
          <Icon src={DirectoryIcon} title="Directory" />
        </td>
        <td tabIndex="0">{ name }</td>
        <td />
        <td />
      </tr>
    );
  }

  Items() {
    // TODO: Sort by name
    const items = Object.keys(this.state.currentDir)
      .filter(name => name !== ".")
      .map(name => {
        return {
          name,
          item: this.state.currentDir[name],
          info: this.state.currentDir[name]["."]
        };
      });

    if(items.length === 0) {
      return (
        <tr><td/><td>No files</td><td/><td/></tr>
      );
    }

    // Sort items - directory first, then case-insensitive alphabetical order
    return (
      items.sort((item1, item2) => {
        if(item1.info.type !== item2.info.type) {
          if(item1.info.type === "directory") {
            return -1;
          } else {
            return 1;
          }
        } else {
          return item1.name.toLowerCase() > item2.name.toLowerCase();
        }
      }).map(item => item.info.type === "directory" ? this.Directory(item.name): this.File(item.name, item.info))
    );
  }

  UploadModal() {
    if(!this.state.showUpload) { return null; }

    const closeModal = () => this.setState({showUpload: false});

    return (
      <Modal
        modalContent={
          <UploadWidget
            path={this.state.path}
            displayPath={this.state.displayPath}
            requests={this.props.requests}
            files={this.props.files}
            Upload={this.props.Upload}
            WrapRequest={this.props.WrapRequest}
            OnComplete={() => {
              closeModal();
              this.props.Reload();
            }}
            OnCancel={closeModal}
          />
        }
        closable={true}
        OnClickOutside={closeModal}
      />
    );
  }

  render() {
    let backButton;
    if(this.state.path && this.state.path !== Path.dirname(this.state.path)) {
      backButton = (
        <IconButton
          src={BackIcon}
          title={"Back"}
          onClick={() => this.ChangeDirectory(Path.dirname(this.state.path))}
        />
      );
    }

    return (
      <div className="file-browser">
        { this.UploadModal() }
        <table>
          <thead>
            <tr>
              <th className="type-header">{backButton}</th>
              <th title={"Current Directory: " + this.state.displayPath} tabIndex="0">{this.state.displayPath}</th>
              <th className="size-header" />
              <th className="actions-header">
                <IconButton
                  src={UploadIcon}
                  title={"Upload to " + this.state.displayPath}
                  onClick={() => this.setState({showUpload: true})}
                />
              </th>
            </tr>
          </thead>
          <tbody>
            { this.Items() }
          </tbody>
        </table>
      </div>
    );
  }
}

FileBrowser.propTypes = {
  requests: PropTypes.object.isRequired,
  files: PropTypes.object.isRequired,
  Reload: PropTypes.func.isRequired,
  Upload: PropTypes.func.isRequired,
  Download: PropTypes.func.isRequired,
  WrapRequest: PropTypes.func.isRequired
};

export default FileBrowser;
