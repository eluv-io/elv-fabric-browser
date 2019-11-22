import React from "react";
import PropTypes from "prop-types";
import PrettyBytes from "pretty-bytes";
import UrlJoin from "url-join";
import URI from "urijs";
import Path from "path";
import {Action, Modal, IconButton, ImageIcon, Copy, Confirm} from "elv-components-js";
import FileUploadWidget from "./FileUploadWidget";

import DirectoryIcon from "../../static/icons/directory.svg";
import FileIcon from "../../static/icons/file.svg";
import DownloadIcon from "../../static/icons/download.svg";
import BackIcon from "../../static/icons/directory_back.svg";
import LinkIcon from "../../static/icons/link.svg";
import DeleteIcon from "../../static/icons/trash.svg";
import {inject, observer} from "mobx-react";

@inject("objectStore")
@observer
class FileBrowser extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      path: ".",
      displayPath: "/",
      showUpload: false
    };

    this.UploadFiles = this.UploadFiles.bind(this);
    this.DeleteItem = this.DeleteItem.bind(this);
  }

  async UploadFiles({path, fileList, callback}) {
    await this.props.objectStore.UploadFiles({
      libraryId: this.props.objectStore.libraryId,
      objectId: this.props.objectStore.objectId,
      path,
      fileList,
      callback
    });

    if(this.props.Reload) { this.props.Reload(); }
  }

  async DeleteItem(item) {
    await Confirm({
      message: "Are you sure you want to delete this file?",
      onConfirm: async () => {
        this.props.objectStore.DeleteFiles({
          libraryId: this.props.objectStore.libraryId,
          objectId: this.props.objectStore.objectId,
          filePaths: [UrlJoin(this.state.path, item).replace("./", "")]
        });

        if(this.props.Reload) { this.props.Reload(); }
      }
    });
  }

  CurrentDirectory() {
    let files = this.props.objectStore.object.meta.files || {};

    if(this.state.path === ".") {
      return files;
    }

    this.state.path
      .replace("./", "")
      .split("/")
      .forEach(directory => files = files[directory]);

    return files;
  }

  ChangeDirectory(dirname) {
    dirname = Path.normalize(dirname);

    this.setState({
      path: dirname,
      displayPath: dirname === "." ? "/" : "/" + dirname,
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
              title={`Download ${name}`}
              icon={DownloadIcon}
              label={"Download " + name}
              className="download-button"
            />
          </a>
          <Copy copy={fileUrl}>
            <IconButton
              title={`Copy link to ${name}`}
              icon={LinkIcon}
              label={"Copy direct link to " + name}
              className="copy-button"
            />
          </Copy>
          <IconButton
            title={`Delete ${name}`}
            icon={DeleteIcon}
            onClick={event => {
              event.stopPropagation();
              this.DeleteItem(name);
            }}
            className="delete-button"
          />
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
        <td className="actions-cell">
          <IconButton
            title={`Delete ${item.name}`}
            icon={DeleteIcon}
            onClick={event => {
              event.stopPropagation();
              this.DeleteItem(item.name);
            }}
            className="delete-button"
          />
        </td>
      </tr>
    );
  }

  Items() {
    const currentDirectory = this.CurrentDirectory();

    const items = Object.keys(currentDirectory)
      .filter(name => name !== ".")
      .map(name => {
        return {
          name,
          item: currentDirectory[name],
          info: currentDirectory[name]["."],
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
          return item1.name.toLowerCase() < item2.name.toLowerCase() ? -1 : 1;
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
          Upload={this.UploadFiles}
          OnComplete={() => {
            closeModal();
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
  baseFileUrl: PropTypes.string.isRequired,
  Reload: PropTypes.func
};

export default FileBrowser;
