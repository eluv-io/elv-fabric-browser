import ContentObject from "./ContentObject";
import Fabric from "../clients/Fabric";

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

  ImageUrl() {
    return this.libraryObject && this.libraryObject.HasImage() && this.libraryObject.RepUrl("image");
  }

  constructor({ libraryId, owner, libraryMetadata, contentObjectsData=[], groups={}, url }) {
    libraryMetadata = libraryMetadata || {};
    this.libraryId = libraryId;
    this.owner = owner;
    this.groups = groups;
    this.url = url;
    this.name = libraryMetadata["eluv.name"] || "Content Library " + libraryId;
    this.description = libraryMetadata["eluv.description"];
    this.contractAddress = libraryMetadata["eluv.contract_address"];
    this.contentObjects = [];

    this.metadata = this.FilterMetadata(libraryMetadata);

    for(const contentObjectData of contentObjectsData) {
      let contentObject = new ContentObject({ libraryId, owner: contentObjectData.owner, contentObjectData: contentObjectData });

      if(contentObject.isLibraryObject) {
        this.libraryObject = contentObject;
        this.privateMetadata = this.libraryObject.metadata;
      } else {
        this.contentObjects.push(contentObject);
      }
    }

    if(this.libraryId === Fabric.contentSpaceLibraryId) {
      this.isContentSpaceLibrary = true;
    }
  }
}

export default ContentLibrary;
