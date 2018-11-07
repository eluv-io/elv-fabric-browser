import Path from "path";
import URI from "urijs";
import PrettyBytes from "pretty-bytes";

class ContentObject {
  constructor({ libraryId, contentObjectData }) {
    this.rawData = contentObjectData;

    if(!contentObjectData) {
      this.metadata = {};
      return;
    }

    this.url = contentObjectData.url;

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

  RepUrl(rep) {
    if(!this.url) { return ""; }

    const url = new URI(this.url);
    url.path(Path.join(url.path(), "rep", rep));

    return url.toString();
  }

  HasImage() {
    return this.metadata && (this.metadata.image || this.metadata["eluv.image"]);
  }
}

export default ContentObject;
