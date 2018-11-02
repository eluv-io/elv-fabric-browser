import ContentReducer from "../../src/reducers/ContentReducer";
import ActionTypes from "../../src/actions/ActionTypes";
import ContentLibrary from "../../src/models/ContentLibrary";
import ContentObject from "../../src/models/ContentObject";

describe("Request Reducer", () => {
  let initialState = {
    contentLibraries: {},
    contentObjects: {}
  };

  const contentLibrary = new ContentLibrary({
    libraryId: "ilibNLWSsptc11nHg6YNYhUair",
    contentObjectsData: [
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
    ]
  });

  test("Initial state", () => {
    expect(ContentReducer(undefined, {type: "@@INIT"})).toEqual(initialState);
  });

  test("List all", () => {
    let resultState = ContentReducer(
      initialState,
      {
        type: ActionTypes.request.content.completed.list.all,
        contentLibraries: { "ilibNLWSsptc11nHg6YNYhUair": contentLibrary }
      }
    );

    expect(resultState).toMatchSnapshot();
  });

  test("Get library", () => {
    let resultState = ContentReducer(
      initialState,
      {
        type: ActionTypes.request.content.completed.list.library,
        libraryId: "ilibNLWSsptc11nHg6YNYhUair",
        contentLibrary: contentLibrary
      }
    );

    expect(resultState).toMatchSnapshot();
  });

  test("Get content object", () => {
    let contentObject = new ContentObject({
      libraryId: "ilibNLWSsptc11nHg6YNYhUair",
      contentObjectData: {
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
    });

    let resultState = ContentReducer(
      initialState,
      {
        type: ActionTypes.request.content.completed.list.contentObject,
        contentObject
      }
    );

    expect(resultState).toMatchSnapshot();
  });
});
