import React from "react";
import PropTypes from "prop-types";
import PrettyBytes from "pretty-bytes";
import Path from "path";
import { SafeTraverse } from "../../utils/Helpers";
import InlineSVG from "svg-inline-react";

import DirectoryIcon from "../../static/icons/directory.svg";
import FileIcon from "../../static/icons/file.svg";
import DownloadIcon from "../../static/icons/download.svg";
import UploadIcon from "../../static/icons/upload.svg";
import BackIcon from "../../static/icons/directory_back.svg";
import Modal from "../modals/Modal";
import UploadWidget from "./UploadWidget";

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
    const download = () => this.props.Download(Path.join(this.state.path, name));
    return (
      <tr key={`entry-${this.state.path}-${name}`}>
        <td className="item-icon">
          <InlineSVG className="icon dark" src={FileIcon} />
        </td>
        <td>{ name }</td>
        <td>{ PrettyBytes(info.size || 0) }</td>
        <td>
          <InlineSVG
            className="icon dark icon-clickable"
            title={"Download " + name}
            src={DownloadIcon}
            onClick={download}
          />
        </td>
      </tr>
    );
  }

  Directory(name, info) {
    const changeDirectory = () => this.ChangeDirectory(Path.join(this.state.path, name));
    return (
      <tr key={`entry-${this.state.path}-${name}`} className="directory" onClick={changeDirectory}>
        <td className="item-icon">
          <InlineSVG className="icon dark" src={DirectoryIcon} />
        </td>
        <td>{ name }</td>
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

    const directories = items.filter(item => item.info.type === "directory");
    const files = items.filter(item => item.info.type !== "directory");

    // Display directories before files
    return (
      directories.map(directory => this.Directory(directory.name, directory.info))
        .concat(files.map(file => this.File(file.name, file.info)))
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
        <InlineSVG
          className="icon icon-clickable dark"
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
              <th>{this.state.displayPath}</th>
              <th className="size-header" />
              <th className="actions-header">
                <InlineSVG
                  className="icon icon-clickable dark"
                  src={UploadIcon}
                  title={"Upload"}
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
