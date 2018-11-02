import ContentObject from "../../src/models/ContentObject";

describe("Content Library and Object Models", () => {
  test("Basic library object", () => {
    const contentObjectData =
      {
        "id": "iq__S5Q8fUSmFbTyZ6D53HPCuR",
        "versions": [
          {
            "id": "iq__S5Q8fUSmFbTyZ6D53HPCuR",
            "hash": "hq__QmWZ3FfjFio1TCuZjR5Qxpop6idvmzqW8LXJ1Ze2V648XS",
            "type": "",
            "meta": {
              "eluv.contract_address": "0xCe8f7fDc682C2b4Af0d412D5DAb046F820E25Ef9",
              "eluv.name": "TEST",
              "eluv.type": "library",
              "description": "test description"
            }
          }
        ]
      };

    const contentObject = new ContentObject({libraryId: "ilibNLWSsptc11nHg6YNYhUair", contentObjectData});

    expect(contentObject.libraryId).toBe("ilibNLWSsptc11nHg6YNYhUair");
    expect(contentObject.objectId).toBe("iq__S5Q8fUSmFbTyZ6D53HPCuR");
    expect(contentObject.versions.length).toBe(1);
    expect(contentObject.latestVersion).toBeDefined();
    expect(contentObject.hash).toBe("hq__QmWZ3FfjFio1TCuZjR5Qxpop6idvmzqW8LXJ1Ze2V648XS");
    expect(contentObject.metadata).toBeDefined();
    expect(contentObject.metadata["eluv.name"]).toBe("TEST");
    expect(contentObject.name).toBe("TEST");
    expect(contentObject.type).toBe("library");
    expect(contentObject.description).toBe("test description");
  });

  test("Basic library object version", () => {
    const contentObjectData =
      {
        "id": "iq__S5Q8fUSmFbTyZ6D53HPCuR",
        "hash": "hq__QmWZ3FfjFio1TCuZjR5Qxpop6idvmzqW8LXJ1Ze2V648XS",
        "type": "",
        "meta": {
          "eluv.contract_address": "0xCe8f7fDc682C2b4Af0d412D5DAb046F820E25Ef9",
          "eluv.name": "TEST",
          "eluv.type": "library",
          "description": "test description"
        }
      };

    const contentObject = new ContentObject({libraryId: "ilibNLWSsptc11nHg6YNYhUair", contentObjectData});

    expect(contentObject.libraryId).toBe("ilibNLWSsptc11nHg6YNYhUair");
    expect(contentObject.objectId).toBe("iq__S5Q8fUSmFbTyZ6D53HPCuR");
    expect(contentObject.versions).not.toBeDefined();
    expect(contentObject.latestVersion).toBeDefined();
    expect(contentObject.hash).toBe("hq__QmWZ3FfjFio1TCuZjR5Qxpop6idvmzqW8LXJ1Ze2V648XS");
    expect(contentObject.metadata).toBeDefined();
    expect(contentObject.metadata["eluv.name"]).toBe("TEST");
    expect(contentObject.name).toBe("TEST");
    expect(contentObject.type).toBe("library");
    expect(contentObject.description).toBe("test description");
  });

  test("Object with image", () => {
    const contentObjectData =
      {
        "id": "iq__S5Q8fUSmFbTyZ6D53HPCuR",
        "versions": [
          {
            "id": "iq__S5Q8fUSmFbTyZ6D53HPCuR",
            "hash": "hq__QmWZ3FfjFio1TCuZjR5Qxpop6idvmzqW8LXJ1Ze2V648XS",
            "type": "",
            "meta": {
              "image": "hqp_QmWZ3FfjFio1TCuZjR5Qxpop6idvmzqW8LXJ1Ze2V648XS",
            }
          }
        ]
      };

    const contentObject = new ContentObject({libraryId: "ilibNLWSsptc11nHg6YNYhUair", contentObjectData});

    expect(contentObject.Image())
      .toBe("http://localhost:8008/qlibs/ilibNLWSsptc11nHg6YNYhUair/q/hq__QmWZ3FfjFio1TCuZjR5Qxpop6idvmzqW8LXJ1Ze2V648XS/data/hqp_QmWZ3FfjFio1TCuZjR5Qxpop6idvmzqW8LXJ1Ze2V648XS");
  });
});
