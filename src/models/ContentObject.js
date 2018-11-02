import Fabric from "../clients/Fabric";
import PrettyBytes from "pretty-bytes";

class ContentObject {
  constructor({ libraryId, contentObjectData }) {
    this.rawData = contentObjectData;

    //this.url = this.rawData.url;

    if(!contentObjectData) {
      this.metadata = {};
      return;
    }

    this.libraryId = libraryId;
    this.objectId = contentObjectData.id;

    // Library metadata object has same ID as library, with different prefix
    if(this.libraryId === this.objectId.replace("iq__", "ilib")) {
      this.name = "Library Content Object";
    }

    if(contentObjectData.versions) {
      this.versions = contentObjectData.versions.map(
        version => new ContentObject({libraryId, contentObjectData: version})
      );
      this.latestVersion = this.versions[0];
    }

    this.hash = contentObjectData.hash;
    this.metadata = (this.latestVersion && this.latestVersion.metadata) || contentObjectData.meta || {};
    this.name = this.name || this.metadata["eluv.name"] || "Content Object " + contentObjectData.id;
    this.type = contentObjectData.type || this.metadata["eluv.type"];
    this.description = this.metadata["description"];
    this.verification = contentObjectData.verification;

    if(contentObjectData.parts) {
      this.parts = contentObjectData.parts;
    }
  }

  TotalSize() {
    return PrettyBytes(this.parts.reduce((a, part) => a + part.size, 0));
  }

  Image(key="image") {
    /*
    if(this.metadata && this.metadata[key]) {
      return Fabric.PartUrl({
        libraryId: this.libraryId,
        contentHash: this.hash,
        partHash: this.metadata[key]
      });
    }
    */
  }
}

export default ContentObject;
