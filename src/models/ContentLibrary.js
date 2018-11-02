import ContentObject from "./ContentObject";

class ContentLibrary {
  constructor({ libraryId, libraryMetadata, contentObjectsData, url }) {
    libraryMetadata = libraryMetadata || {};
    this.libraryId = libraryId;
    this.url = url;
    this.name = libraryMetadata["eluv.name"] || "Content Library " + libraryId;
    this.description = libraryMetadata["eluv.description"];
    this.contractAddress = libraryMetadata["eluv.contract_address"];
    this.contentObjects = [];

    for(const contentObjectData of contentObjectsData) {
      let contentObject = new ContentObject({ libraryId, contentObjectData: contentObjectData });

      this.contentObjects.push(contentObject);
    }
  }
}

export default ContentLibrary;
