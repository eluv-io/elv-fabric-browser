import React from "react";
import PropTypes from "prop-types";
import PrettyBytes from "pretty-bytes";
import UrlJoin from "url-join";
import URI from "urijs";
import Path from "path";
import {SafeTraverse} from "../../utils/Helpers";
import {Action, Modal, IconButton, ImageIcon, Copy} from "elv-components-js";
import FileUploadWidget from "./FileUploadWidget";

import DirectoryIcon from "../../static/icons/directory.svg";
import FileIcon from "../../static/icons/file.svg";
import DownloadIcon from "../../static/icons/download.svg";
import BackIcon from "../../static/icons/directory_back.svg";
import LinkIcon from "../../static/icons/link.svg";

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

  FileUrl(path, filename) {
    const uri = URI(this.props.baseFileUrl);

    uri.path(UrlJoin(uri.path(), path, filename).replace("//", "/"));

    return uri.toString();
  }

  File(name, info) {
    const size = PrettyBytes(info.size || 0);
    const fileUrl = this.FileUrl(this.state.path, name);
    return (
      <tr key={`entry-${this.state.path}-${name}`}>
        <td className="item-icon">
          <ImageIcon icon={FileIcon} label="File"/>
        </td>
        <td title={name}>{ name }</td>
        <td title={size} className="info-cell">{ size }</td>
        <td className="actions-cell">
          <a href={fileUrl} target="_blank">
            <ImageIcon
              icon={DownloadIcon}
              label={"Download " + name}
              className="download-button"
            />
          </a>
          <Copy copy={fileUrl}>
            <IconButton
              icon={LinkIcon}
              label={"Copy direct link to " + name}
              className="copy-button"
            />
          </Copy>
        </td>
      </tr>
    );
  }

  Directory(item) {
    const changeDirectory = () => this.ChangeDirectory(UrlJoin(this.state.path, item.name));
    return (
      <tr key={`entry-${this.state.path}-${item.name}`} className="directory" onClick={changeDirectory} onKeyPress={changeDirectory}>
        <td className="item-icon">
          <ImageIcon icon={DirectoryIcon} label="Directory" />
        </td>
        <td tabIndex="0" title={item.name}>{item.name}</td>
        <td className="info-cell">{(Object.keys(item.item).length - 1) + " Items"}</td>
        <td />
      </tr>
    );
  }

  Items() {
    const items = Object.keys(this.state.currentDir)
      .filter(name => name !== ".")
      .map(name => {
        return {
          name,
          item: this.state.currentDir[name],
          info: this.state.currentDir[name]["."],
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
      }).map(item => item.info.type === "directory" ? this.Directory(item): this.File(item.name, item.info))
    );
  }

  UploadModal() {
    if(!this.state.showUpload) { return null; }

    const closeModal = () => this.setState({showUpload: false});

    return (
      <Modal
        closable={false}
        OnClickOutside={closeModal}
      >
        <FileUploadWidget
          path={this.state.path}
          legend={`Upload files to ${this.state.displayPath}`}
          files={this.props.files}
          uploadStatus={this.props.uploadStatus}
          Upload={this.props.Upload}
          OnComplete={() => {
            closeModal();
            this.props.Reload();
          }}
          OnCancel={closeModal}
        />
      </Modal>
    );
  }

  render() {
    let backButton;
    if(this.state.path && this.state.path !== Path.dirname(this.state.path)) {
      backButton = (
        <IconButton
          icon={BackIcon}
          label={"Back"}
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
                <Action
                  onClick={() => this.setState({showUpload: true})}
                >
                  Upload
                </Action>
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
  files: PropTypes.object.isRequired,
  baseFileUrl: PropTypes.string.isRequired,
  Upload: PropTypes.func.isRequired,
  Download: PropTypes.func.isRequired,
  FileUrl: PropTypes.func.isRequired,
  Reload: PropTypes.func.isRequired
};

export default FileBrowser;
