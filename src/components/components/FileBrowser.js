import React, {useState} from "react";
import PropTypes from "prop-types";
import PrettyBytes from "pretty-bytes";
import UrlJoin from "url-join";
import Path from "path";
import {inject, observer} from "mobx-react";

import {
  Action,
  Modal,
  IconButton,
  ImageIcon,
  Confirm,
  BallClipRotate,
  PreviewIcon,
  Form,
  AsyncCopy,
  Maybe
} from "elv-components-js";
import FileUploadWidget from "./FileUploadWidget";

import DirectoryIcon from "../../static/icons/directory.svg";
import FileIcon from "../../static/icons/file.svg";
import PictureIcon from "../../static/icons/image.svg";
import EncryptedFileIcon from "../../static/icons/encrypted-file.svg";
import EncryptedImageIcon from "../../static/icons/encrypted-image.svg";
import ReferenceFileIcon from "../../static/icons/external-link.svg";
import DownloadIcon from "../../static/icons/download.svg";
import BackIcon from "../../static/icons/directory_back.svg";
import LinkIcon from "../../static/icons/link.svg";
import DeleteIcon from "../../static/icons/trash.svg";


const DownloadButton = ({name, DownloadFile, hidden}) => {
  if(hidden) { return null; }

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

const ImagePreview = ({encrypted, GetFileUrl, fileName}) => {
  const [loading, setLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(undefined);

  const Load = async () => {
    if(loading || previewUrl) { return; }

    setLoading(true);
    setPreviewUrl(await GetFileUrl());
    setLoading(false);
  };

  return (
    <PreviewIcon
      onHover={Load}
      imagePath={fileName}
      fullUrl={previewUrl || ""}
      icon={encrypted ? EncryptedImageIcon : PictureIcon}
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
      newDirectoryPath: "",
      version: 0
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
        await this.props.objectStore.DeleteFiles({
          libraryId: this.props.objectStore.libraryId,
          objectId: this.props.objectStore.objectId,
          filePaths: [UrlJoin(this.state.path, item).replace("./", "")]
        });

        this.setState({version: this.state.version + 1});

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

  IsImage(name) {
    const mimeTypes = this.props.objectStore.object.meta["mime-types"] || {};
    const extension = name.split(".").pop();
    const mimeType = mimeTypes[extension] || "";
    const isImage =
      mimeType.startsWith("image") ||
      ["jpg", "jpeg", "png", "gif", "webp"].includes(extension);

    return isImage;
  }

  FileIcon(name, encrypted, reference) {
    if(reference) {
      return (
        <ImageIcon
          icon={ReferenceFileIcon}
          className="file-icon"
          title="S3 Reference File"
        />
      );
    }

    if(!this.IsImage(name)) {
      return (
        <ImageIcon
          icon={encrypted ? EncryptedFileIcon : FileIcon}
          className={encrypted ? "encrypted-file-icon" : "file-icon"}
          title={encrypted ? "Encrypted File" : "File"}
        />
      );
    }

    // Image preview
    return (
      <ImagePreview
        encrypted={encrypted}
        fileName={name}
        GetFileUrl={async () => this.props.GetFileUrl({filePath: UrlJoin(this.state.path, name)})}
      />
    );
  }

  File(name, info) {
    const size = PrettyBytes(info.size || 0);
    const encrypted = info.encryption && info.encryption.scheme === "cgck";
    const reference = !!info.reference;

    return (
      <div className="file-browser-row" key={`entry-${this.state.path}-${name}`}>
        <div className="item-icon">
          { this.FileIcon(name, encrypted, reference) }
        </div>
        <div className="item-name-cell" title={name}>
          <div>{ name }</div>
        </div>
        <div title={size} className="info-cell">
          { size }
        </div>
        <div className="actions-cell">
          <IconButton
            hidden={reference || !this.props.SetObjectImage || !this.IsImage(name) || encrypted}
            title={`Set ${name} as display image`}
            icon={PictureIcon}
            onClick={async event => {
              event.stopPropagation();

              await Confirm({
                message: `Are you sure you want to set this object's display image to ${name}?`,
                onConfirm: async () => await this.props.SetObjectImage({
                  filePath: UrlJoin(this.state.path, name).replace("./", "")
                })
              });
            }}
            className="delete-button"
          />
          <DownloadButton
            hidden={reference}
            name={name}
            size={size}
            DownloadFile={async (callback) => await this.props.DownloadFile({
              filePath: UrlJoin(this.state.path, name),
              callback
            })}
          />
          {
            Maybe(
              !reference,
              <AsyncCopy hidden={reference} Load={async () => this.props.GetFileUrl({filePath: UrlJoin(this.state.path, name)})}>
                <IconButton
                  title={`Copy link to ${name}`}
                  icon={LinkIcon}
                  label={"Copy direct link to " + name}
                  className="copy-button"
                />
              </AsyncCopy>
            )
          }
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
      <div className="file-browser" key={`file-browser-${this.state.version}`}>
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
  GetFileUrl: PropTypes.func.isRequired,
  DownloadFile: PropTypes.func.isRequired,
  DownloadUrl: PropTypes.func.isRequired,
  CreateDirectory: PropTypes.func.isRequired,
  SetObjectImage: PropTypes.func,
  Reload: PropTypes.func
};

export default FileBrowser;
