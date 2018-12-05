import Path from "path";
import URI from "urijs";
import PrettyBytes from "pretty-bytes";
import Fabric from "../clients/Fabric";

class ContentObject {
  EluvioKeys() {
    return [
      "eluv.name",
      "eluv.type",
      "eluv.description",
      "caddr"
    ];
  }

  FilterMetadata(metadata) {
    const toRemove = this.EluvioKeys();
    return Object.keys(metadata)
      .filter(key => !toRemove.includes(key))
      .reduce((obj, key) => {
        obj[key] = metadata[key];
        return obj;
      }, {});
  }

  FullMetadata() {
    return Object.assign(
      {
        "eluv.name": this.name,
        "eluv.description": this.description,
        "eluv.type": this.type
      },
      this.metadata || {}
    );
  }

  constructor({ libraryId, owner, contentObjectData }) {
    this.rawData = contentObjectData;

    if(!contentObjectData) {
      this.metadata = {};
      return;
    }

    this.url = contentObjectData.url;

    this.libraryId = libraryId;
    this.objectId = contentObjectData.id;
    this.owner = owner;

    if(this.objectId) {
      this.contractAddress = Fabric.utils.HashToAddress({hash: this.objectId});
    }

    // Library metadata object has same ID as library, with different prefix
    if(this.objectId && this.libraryId === this.objectId.replace("iq__", "ilib")) {
      this.name = "Library Content Object";
      this.isLibraryObject = true;
    }

    if(contentObjectData.versions) {
      this.versions = contentObjectData.versions.map(
        version => new ContentObject({libraryId, contentObjectData: version})
      );

      this.latestVersion = this.versions[0];
    }

    const metadata = (this.latestVersion && this.latestVersion.FullMetadata()) || contentObjectData.meta || {};

    this.hash = contentObjectData.hash;
    this.name = this.name || metadata["eluv.name"] || "Content Object " + contentObjectData.id;
    this.type = contentObjectData.type || metadata["eluv.type"];
    this.description = metadata["eluv.description"];
    this.metadata = this.FilterMetadata(metadata);
    this.verification = contentObjectData.verification;
    this.status = contentObjectData.status;

    if(contentObjectData.parts) {
      this.parts = contentObjectData.parts;
    }
  }

  TotalSize() {
    return PrettyBytes(this.parts.reduce((a, part) => a + part.size, 0));
  }

  RepUrl(rep) {
    if(!this.url) { return ""; }

    const url = new URI(this.url);
    url.path(Path.join(url.path(), "rep", rep));
    // Add hash to end of url to bust cache if object is updated
    url.query({...url.query(true), hash: this.latestVersion.hash});

    return url.toString();
  }

  HasImage() {
    return this.metadata && (this.metadata.image || this.metadata["eluv.image"]);
  }
}

export default ContentObject;
