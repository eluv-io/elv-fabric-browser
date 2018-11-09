import ContentObject from "./ContentObject";

class ContentLibrary {
  EluvioKeys() {
    return [
      "eluv.name",
      "eluv.description",
      "eluv.contract_address"
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
        "eluv.type": this.type,
        "eluv.contract_address": this.contractAddress
      },
      this.metadata || {}
    );
  }

  constructor({ libraryId, libraryMetadata, contentObjectsData=[], url }) {
    libraryMetadata = libraryMetadata || {};
    this.libraryId = libraryId;
    this.url = url;
    this.name = libraryMetadata["eluv.name"] || "Content Library " + libraryId;
    this.description = libraryMetadata["eluv.description"];
    this.contractAddress = libraryMetadata["eluv.contract_address"];
    this.contentObjects = [];

    this.metadata = this.FilterMetadata(libraryMetadata);

    for(const contentObjectData of contentObjectsData) {
      let contentObject = new ContentObject({ libraryId, contentObjectData: contentObjectData });

      this.contentObjects.push(contentObject);
    }
  }
}

export default ContentLibrary;
