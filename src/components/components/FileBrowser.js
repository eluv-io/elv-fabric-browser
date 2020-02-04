import React, {useState} from "react";
import PropTypes from "prop-types";
import PrettyBytes from "pretty-bytes";
import UrlJoin from "url-join";
import URI from "urijs";
import Path from "path";
import {
  Action,
  Modal,
  IconButton,
  ImageIcon,
  Copy,
  Confirm,
  BallClipRotate,
  PreviewIcon, Form
} from "elv-components-js";
import FileUploadWidget from "./FileUploadWidget";

import DirectoryIcon from "../../static/icons/directory.svg";
import FileIcon from "../../static/icons/file.svg";
import EncryptedFileIcon from "../../static/icons/encrypted-file.svg";
import EncryptedImageIcon from "../../static/icons/encrypted-image.svg";
import DownloadIcon from "../../static/icons/download.svg";
import BackIcon from "../../static/icons/directory_back.svg";
import LinkIcon from "../../static/icons/link.svg";
import DeleteIcon from "../../static/icons/trash.svg";
import {inject, observer} from "mobx-react";

const DownloadButton = ({name, DownloadFile}) => {
  const [downloading, setDownloading] = useState(false);
  const [progress, setProgress] = useState(undefined);

  if(downloading) {
    if(!progress) {
      return (
        <div title={`Downloading ${name}`} className="download-indicator">
          <BallClipRotate />
        </div>
      );
    } else {
      return (
        <span title={`Downloading ${name}`} className="download-progress">
          { ((progress.bytesFinished / progress.bytesTotal) * 100).toFixed(1) }%
        </span>
      );
    }
  }

  const callback = progress => setProgress(progress);

  return (
    <IconButton
      title={`Download ${name}`}
      icon={DownloadIcon}
      label={"Download " + name}
      onClick={async () => {
        setDownloading(true);
        await DownloadFile(callback);

        setDownloading(false);
      }}
      className="download-button"
    />
  );
};

const EncryptedImagePreview = ({DownloadUrl, fileName}) => {
  const [loading, setLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(undefined);

  const Load = async () => {
    if(loading || previewUrl) { return; }

    setLoading(true);
    setPreviewUrl(await DownloadUrl());
    setLoading(false);
  };

  return (
    <PreviewIcon
      onHover={Load}
      imagePath={fileName}
      fullUrl={previewUrl || ""}
      icon={EncryptedImageIcon}
      additionalContent={loading ? <BallClipRotate/> : null}
    />
  );
};

@inject("objectStore")
@observer
class FileBrowser extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      path: ".",
      displayPath: "/",
      showUpload: false,
      showDirectoryCreate: false,
      newDirectoryPath: ""
    };

    this.UploadFiles = this.UploadFiles.bind(this);
    this.DeleteItem = this.DeleteItem.bind(this);
  }

  async UploadFiles({path, fileList, encrypt, callback}) {
    await this.props.objectStore.UploadFiles({
      libraryId: this.props.objectStore.libraryId,
      objectId: this.props.objectStore.objectId,
      path,
      fileList,
      encrypt,
      callback
    });

    if(this.props.Reload) { this.props.Reload(); }
  }

  async DeleteItem(item, directory=false) {
    await Confirm({
      message: `Are you sure you want to delete this ${directory ? "directory" : "file"}?`,
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

  FileIcon(name, fileUrl, encrypted) {
    const mimeTypes = this.props.objectStore.object.meta["mime-types"] || {};
    const extension = name.split(".").pop();
    const mimeType = mimeTypes[extension] || "";
    const isImage =
      mimeType.startsWith("image") ||
      ["jpg", "jpeg", "png", "gif", "webp"].includes(extension);

    if(!isImage) {
      return (
        <ImageIcon
          icon={encrypted ? EncryptedFileIcon : FileIcon}
          className={encrypted ? "encrypted-file-icon" : "file-icon"}
          label="File"
        />
      );
    }

    // Image preview

    if(encrypted) {
      return (
        <EncryptedImagePreview
          fileName={name}
          DownloadUrl={async () => this.props.DownloadUrl({filePath: UrlJoin(this.state.path, name)})}
        />
      );
    } else {
      return (
        <PreviewIcon
          baseFileUrl={this.props.baseFileUrl}
          imagePath={name}
        />
      );
    }
  }

  File(name, info) {
    const size = PrettyBytes(info.size || 0);
    const fileUrl = this.FileUrl(this.state.path, name);
    const encrypted = info.encryption && info.encryption.scheme === "cgck";
    return (
      <div className="file-browser-row" key={`entry-${this.state.path}-${name}`}>
        <div className="item-icon">
          { this.FileIcon(name, fileUrl, encrypted) }
        </div>
        <div className="item-name-cell" title={name}>
          <div>{ name }</div>
        </div>
        <div title={size} className="info-cell">
          { size }
        </div>
        <div className="actions-cell">
          <DownloadButton
            name={name}
            size={size}
            DownloadFile={async (callback) => await this.props.DownloadFile({
              filePath: UrlJoin(this.state.path, name),
              callback
            })}
          />
          <Copy copy={fileUrl}>
            <IconButton
              hidden={encrypted}
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
        </div>
      </div>
    );
  }

  Directory(item) {
    const changeDirectory = () => this.ChangeDirectory(UrlJoin(this.state.path, item.name));
    const count = Object.keys(item.item).length - 1;
    return (
      <div key={`entry-${this.state.path}-${item.name}`} className="file-browser-row directory">
        <div className="item-icon">
          <ImageIcon icon={DirectoryIcon} label="Directory" />
        </div>
        <div className="directory-cell" tabIndex="0" title={item.name} onClick={changeDirectory} onKeyPress={changeDirectory}>
          <div>{item.name}</div>
        </div>
        <div className="info-cell">
          { `${count} ${count === 1 ? "Item" : "Items"}` }
        </div>
        <div className="actions-cell">
          <IconButton
            title={`Delete ${item.name}`}
            icon={DeleteIcon}
            onClick={event => {
              event.stopPropagation();
              this.DeleteItem(item.name, true);
            }}
            className="delete-button"
          />
        </div>
      </div>
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
        <div className="file-browser-row file-browser-row-empty">
          No Files
        </div>
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
      }).map(item =>
        item.info.type === "directory" ?
          this.Directory(item) :
          this.File(item.name, item.info)
      )
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
          encryptable
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

  DirectoryCreateModal() {
    if(!this.state.showDirectoryCreate) { return null; }

    const closeModal = () => this.setState({
      showDirectoryCreate: false,
      newDirectoryPath: ""
    });

    return (
      <Modal
        closable={true}
        OnClickOutside={closeModal}
      >
        <Form
          legend={"Create Directory"}
          OnCancel={closeModal}
          OnSubmit={async () => {
            await this.props.CreateDirectory({
              directory: UrlJoin(this.state.path, this.state.newDirectoryPath)
            });
          }}
          OnComplete={closeModal}
        >
          <div className="form-content">
            <label htmlFor="newDirectoryPath">Directory</label>
            <input
              name="newDirectoryPath"
              required
              placeholder="Directory..."
              onChange={event => this.setState({newDirectoryPath: event.target.value})}
            />
          </div>
        </Form>
      </Modal>
    );
  }

  render() {
    let backButton;
    if(this.state.path && this.state.path !== Path.dirname(this.state.path)) {
      backButton = (
        <IconButton
          icon={BackIcon}
          label="Back"
          onClick={() => this.ChangeDirectory(Path.dirname(this.state.path))}
        />
      );
    }

    return (
      <div className="file-browser">
        { this.UploadModal() }
        { this.DirectoryCreateModal() }
        <div className="file-browser-table">
          <div className="file-browser-row file-browser-header">
            <div className="type-header">
              {backButton}
            </div>
            <div className="directory-header" title={"Current Directory: " + this.state.displayPath} tabIndex="0">
              <div className="display-path">{this.state.displayPath}</div>
            </div>
            <div className="actions-header">
              <Action
                onClick={() => this.setState({showDirectoryCreate: true})}
              >
                Create Directory
              </Action>
              <Action
                onClick={() => this.setState({showUpload: true})}
              >
                Upload Files
              </Action>
            </div>
          </div>
          { this.Items() }
        </div>
      </div>
    );
  }
}

FileBrowser.propTypes = {
  baseFileUrl: PropTypes.string.isRequired,
  DownloadFile: PropTypes.func.isRequired,
  DownloadUrl: PropTypes.func.isRequired,
  CreateDirectory: PropTypes.func.isRequired,
  Reload: PropTypes.func
};

export default FileBrowser;
