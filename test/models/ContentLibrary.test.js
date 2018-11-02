import ContentLibrary from "../../src/models/ContentLibrary";

describe("Content Library and Object Models", () => {
  test("Empty library", () => {
    const contentObjectsData = [
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
      }
    ];

    const contentLibrary = new ContentLibrary({libraryId: "ilibNLWSsptc11nHg6YNYhUair", contentObjectsData});

    expect(contentLibrary.libraryId).toBe("ilibNLWSsptc11nHg6YNYhUair");
    expect(contentLibrary.name).toBe("TEST");
    expect(contentLibrary.description).toBe("test description");
    expect(contentLibrary.contentObjects.length).toBe(0);
    expect(contentLibrary.libraryMetadataObject).toBeDefined();
  });
});
