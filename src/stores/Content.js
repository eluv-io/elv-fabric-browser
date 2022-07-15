import {flow, computed, observable} from "mobx";
import Utils from "@eluvio/elv-client-js/src/Utils";

class ContentStore {
  OBJECTS_PER_PAGE = 50;

  @observable libraries = undefined;
  contentTypesPromise = undefined;

  @computed get client() {
    return this.rootStore.client;
  }

  constructor(rootStore) {
    this.rootStore = rootStore;
  }

  LoadLibraries = flow(function * () {
    if(!this.libraries) {
      this.libraries = {};

      const libraryIds = yield this.client.ContentLibraries();
      yield Promise.all(
        libraryIds.map(async libraryId => {
          const name = (await this.client.ContentObjectMetadata({
            libraryId,
            objectId: libraryId.replace(/^ilib/, "iq__"),
            metadataSubtree: "public/name"
          })) || libraryId;

          this.libraries[libraryId] = {
            libraryId,
            name
          };
        })
      );
    }

    return this.libraries;
  });

  LoadObjects = flow(function * ({libraryId, page=1, filter, sortKey="/public/name", sortAsc=true, SetDisabled, disableTitle}) {
    const { contents, paging } = yield this.client.ContentObjects({
      libraryId,
      filterOptions: {
        select: [
          "public/name",
          "public/asset_metadata/title",
          "public/asset_metadata/display_title",
          "public/asset_metadata/sources"
        ],
        sort: sortKey,
        start: (page - 1) * this.OBJECTS_PER_PAGE,
        limit: this.OBJECTS_PER_PAGE,
        sortDesc: !sortAsc,
        filter: !filter ? null :
          {
            key: "/public/name",
            type: "cnt",
            filter: filter.toLowerCase()
          }
      }
    });

    const promises = contents.map(async ({id, versions}) => {
      const versionHash = versions[0].hash;
      const metadata = (versions[0].meta || {});
      const assetMetadata = ((metadata || {}).public || {}).asset_metadata || {};
      const disabled = SetDisabled && await SetDisabled({objectId: id, libraryId});

      return {
        objectId: id,
        versionHash,
        name: (metadata.public || {}).name || id,
        playable: !!assetMetadata.sources,
        title: disabled ? disableTitle : assetMetadata.display_title || assetMetadata.title,
        disabled
      };
    });
    const objects = yield Promise.all(promises);

    return { objects, paging };
  });

  LoadObject = flow(function * ({libraryId, objectId}) {
    const [objectInfo, versions] = yield Promise.all([
      this.client.ContentObject({
        libraryId,
        objectId
      }),
      this.client.ContentObjectVersions({
        libraryId,
        objectId
      })
    ]);

    const types = yield this.contentTypesPromise;

    return {
      type: objectInfo.type ? types[Utils.DecodeVersionHash(objectInfo.type).objectId] : null,
      versions: versions.versions.map(version => version.hash)
    };
  });

  async LookupContent(contentId) {
    contentId = contentId.replace(/ /g, "");

    if(!contentId) { return; }

    try {
      let libraryId, objectId, versionHash, latestVersionHash, name, accessType;
      if(contentId.startsWith("ilib")) {
        libraryId = contentId;
        accessType = "library";
      } else if(contentId.startsWith("hq__")) {
        versionHash = contentId;
        objectId = Utils.DecodeVersionHash(contentId).objectId;
      } else if(contentId.startsWith("iq__")) {
        objectId = contentId;
        latestVersionHash = await this.client.LatestVersionHash({objectId});
      } else if(contentId.startsWith("0x")) {
        const id = Utils.AddressToObjectId(contentId);
        accessType = await this.client.AccessType({id});

        if(accessType === "library") {
          libraryId = Utils.AddressToLibraryId(contentId);
        } else {
          objectId = id;
        }
      } else {
        objectId = Utils.AddressToObjectId(Utils.HashToAddress(contentId));
      }

      if(objectId && !libraryId) {
        libraryId = await this.client.ContentObjectLibraryId({objectId});
      }

      if(!accessType) {
        accessType = await this.client.AccessType({id: objectId});
      }

      if(objectId) {
        name = await this.client.ContentObjectMetadata({
          versionHash: versionHash || latestVersionHash,
          metadataSubtree: "public/name"
        });
      }

      if(accessType === "library") {
        return { libraryId };
      } else if(accessType === "object") {
        return { name, libraryId, objectId, versionHash, latestVersionHash };
      }

      throw Error(`Unsupported type '${accessType}'`);
    } catch(error) {
      // eslint-disable-next-line no-console
      console.error("Failed to look up ID:", error);

      return {};
    }
  }
}

export default ContentStore;
