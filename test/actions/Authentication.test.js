import configureStore from "redux-mock-store";
import thunk from "redux-thunk";
import LocalStorageMock from "../mocks/LocalStorage.mock";

import {AddAccount, LogOut, RemoveAccount, SwitchAccount} from "../../src/actions/Authentication";
import ElvWallet from "../mocks/ElvWallet.mock";

import { AwaitRequest } from "../utils";

const mockStore = configureStore([ thunk ]);
const store = mockStore();

// Account management - log in, log out, switch accounts

describe("Authentication Actions", () => {
  let wallet;

  beforeEach(() => {
    store.clearActions();
    global.localStorage = new LocalStorageMock();
    wallet = new ElvWallet();
  });

  describe("Add Account", () => {
    test("Adds accounts", async () => {
      // Add first account
      const firstAccountAddress = "0x71b011b67dc8f5c323a34cd14b952721d5750c93";

      let requestId = store.dispatch(AddAccount({
        accountName: "Test Account",
        encryptedPrivateKey: "{\"address\":\"71b011b67dc8f5c323a34cd14b952721d5750c93\",\"crypto\":{\"cipher\":\"aes-128-ctr\",\"ciphertext\":\"768c0b26476793e52c7e292b6b221fa4d7f82a7d20a7ccc042ce43c072f97f38\",\"cipherparams\":{\"iv\":\"049e2bed69573f62da6576c21769b520\"},\"kdf\":\"scrypt\",\"kdfparams\":{\"dklen\":32,\"n\":262144,\"p\":1,\"r\":8,\"salt\":\"332b0f7730c580aa86b3ec8e79d228e9f76426bb328c468cb57e99e39132c29f\"},\"mac\":\"36079b7f32edf1c3d8d1697313f8088c78be07627ffb6421f655409373fded79\"},\"id\":\"8181d812-ab5e-4e5b-b023-e9049c2aec48\",\"version\":3}",
        password: "test",
        wallet
      }));

      expect(await AwaitRequest({store, requestId})).toBe(true);

      // Ensure account information stored in localstorage is correct
      let storedAccounts = JSON.parse(atob(global.localStorage.getItem("accounts")));
      const expectedFirstAccountInfo = {
        "accountName": "Test Account",
        "accountAddress": "0x71b011b67dc8f5c323a34cd14b952721d5750c93",
        "encryptedPrivateKey": "{\"address\":\"71b011b67dc8f5c323a34cd14b952721d5750c93\",\"crypto\":{\"cipher\":\"aes-128-ctr\",\"ciphertext\":\"768c0b26476793e52c7e292b6b221fa4d7f82a7d20a7ccc042ce43c072f97f38\",\"cipherparams\":{\"iv\":\"049e2bed69573f62da6576c21769b520\"},\"kdf\":\"scrypt\",\"kdfparams\":{\"dklen\":32,\"n\":262144,\"p\":1,\"r\":8,\"salt\":\"332b0f7730c580aa86b3ec8e79d228e9f76426bb328c468cb57e99e39132c29f\"},\"mac\":\"36079b7f32edf1c3d8d1697313f8088c78be07627ffb6421f655409373fded79\"},\"id\":\"8181d812-ab5e-4e5b-b023-e9049c2aec48\",\"version\":3}"
      };

      expect(global.localStorage.getItem("currentAccount")).toBe(firstAccountAddress);
      expect(storedAccounts[firstAccountAddress]).toEqual(expectedFirstAccountInfo);


      const secondAccountAddress = "0x1cb99a5e4ccead43e98f61d25932bca5bf572484";

      // Add second account
      requestId = store.dispatch(AddAccount({
        accountName: "Another account",
        encryptedPrivateKey: "{\"address\":\"1cb99a5e4ccead43e98f61d25932bca5bf572484\",\"crypto\":{\"cipher\":\"aes-128-ctr\",\"ciphertext\":\"7bbd900da44ddc7c7d4210235cdfaa7e6eb32d4a0575c224497be7215fe0fec9\",\"cipherparams\":{\"iv\":\"af0aba2f91b9bf892d85caba88dd667f\"},\"kdf\":\"scrypt\",\"kdfparams\":{\"dklen\":32,\"n\":262144,\"p\":1,\"r\":8,\"salt\":\"64d3b423f547c7f7b635300f767836d7ddd3746e96103dbcf13d181b3ef75d7f\"},\"mac\":\"055dd28e5ca681c07fa5aba08fee6313a94f739fe11bf7c384593b5d11206acf\"},\"id\":\"1c8f3b1c-6938-43db-9b41-42d5395487e4\",\"version\":3}",
        password: "test",
        wallet
      }));

      expect(await AwaitRequest({store, requestId})).toBe(true);

      storedAccounts = JSON.parse(atob(global.localStorage.getItem("accounts")));

      const expectedSecondAccountInfo = {
        "accountAddress": "0x1cb99a5e4ccead43e98f61d25932bca5bf572484",
        "accountName": "Another account",
        "encryptedPrivateKey": "{\"address\":\"1cb99a5e4ccead43e98f61d25932bca5bf572484\",\"crypto\":{\"cipher\":\"aes-128-ctr\",\"ciphertext\":\"7bbd900da44ddc7c7d4210235cdfaa7e6eb32d4a0575c224497be7215fe0fec9\",\"cipherparams\":{\"iv\":\"af0aba2f91b9bf892d85caba88dd667f\"},\"kdf\":\"scrypt\",\"kdfparams\":{\"dklen\":32,\"n\":262144,\"p\":1,\"r\":8,\"salt\":\"64d3b423f547c7f7b635300f767836d7ddd3746e96103dbcf13d181b3ef75d7f\"},\"mac\":\"055dd28e5ca681c07fa5aba08fee6313a94f739fe11bf7c384593b5d11206acf\"},\"id\":\"1c8f3b1c-6938-43db-9b41-42d5395487e4\",\"version\":3}"
      };

      expect(storedAccounts[firstAccountAddress]).toEqual(expectedFirstAccountInfo);
      expect(storedAccounts[secondAccountAddress]).toEqual(expectedSecondAccountInfo);

      expect(store.getActions()).toMatchSnapshot();

      // Adding a second account should not switch current account
      expect(global.localStorage.getItem("currentAccount")).toBe(firstAccountAddress);
    }, 15000);
  });

  // Attempt to add account with an invalid private key
  test("ERROR: Invalid private key", async () => {
    const requestId = store.dispatch(AddAccount({
      accountName: "Another account",
      encryptedPrivateKey: "{\"address\":\"1cb89a5e4ccead43e98f61d25932bca5bf572484\",\"crypto\":{\"cipher\":\"aes-128-ctr\",\"ciphertext\":\"7bbd900da44ddc7c7d4210235cdfaa7e6eb32d4a0575c224497be7215fe0fec9\",\"cipherparams\":{\"iv\":\"af0aba2f91b9bf892d85caba88dd667f\"},\"kdf\":\"scrypt\",\"kdfparams\":{\"dklen\":32,\"n\":262144,\"p\":1,\"r\":8,\"salt\":\"64d3b423f547c7f7b635300f767836d7ddd3746e96103dbcf13d181b3ef75d7f\"},\"mac\":\"055dd28e5ca681c07fa5aba08fee6313a94f739fe11bf7c384593b5d11206acf\"},\"id\":\"1c8f3b1c-6938-43db-9b41-42d5395487e4\",\"version\":3}",
      password: "test",
      wallet
    }));

    expect(await AwaitRequest({store, requestId})).toBe(false);

    expect(store.getActions()).toMatchSnapshot();
  }, 10000);

  // Attempt to add account with an invalid private key
  test("ERROR: Invalid password", async () => {
    const requestId = store.dispatch(AddAccount({
      accountName: "Another account",
      encryptedPrivateKey: "{\"address\":\"1cb89a5e4ccead43e98f61d25932bca5bf572484\",\"crypto\":{\"cipher\":\"aes-128-ctr\",\"ciphertext\":\"7bbd900da44ddc7c7d4210235cdfaa7e6eb32d4a0575c224497be7215fe0fec9\",\"cipherparams\":{\"iv\":\"af0aba2f91b9bf892d85caba88dd667f\"},\"kdf\":\"scrypt\",\"kdfparams\":{\"dklen\":32,\"n\":262144,\"p\":1,\"r\":8,\"salt\":\"64d3b423f547c7f7b635300f767836d7ddd3746e96103dbcf13d181b3ef75d7f\"},\"mac\":\"055dd28e5ca681c07fa5aba08fee6313a94f739fe11bf7c384593b5d11206acf\"},\"id\":\"1c8f3b1c-6938-43db-9b41-42d5395487e4\",\"version\":3}",
      password: "badpass",
      wallet
    }));

    expect(await AwaitRequest({store, requestId})).toBe(false);

    expect(store.getActions()).toMatchSnapshot();
  }, 10000);

  describe("Switch account", () =>{
    beforeEach(() => {
      // Set accounts localstorage to contain two accounts, 0x71b011B67dc8f5C323A34Cd14b952721D5750C93 and 0x1cb99a5e4ccead43e98f61d25932bca5bf572484
      // with the former set as the current user
      global.localStorage.setItem("accounts", "eyIweDFjYjk5YTVlNGNjZWFkNDNlOThmNjFkMjU5MzJiY2E1YmY1NzI0ODQiOnsiYWNjb3VudE5hbWUiOiJCb2IiLCJhY2NvdW50QWRkcmVzcyI6IjB4MWNiOTlhNWU0Y2NlYWQ0M2U5OGY2MWQyNTkzMmJjYTViZjU3MjQ4NCIsImVuY3J5cHRlZFByaXZhdGVLZXkiOiJ7XCJhZGRyZXNzXCI6XCIxY2I5OWE1ZTRjY2VhZDQzZTk4ZjYxZDI1OTMyYmNhNWJmNTcyNDg0XCIsXCJjcnlwdG9cIjp7XCJjaXBoZXJcIjpcImFlcy0xMjgtY3RyXCIsXCJjaXBoZXJ0ZXh0XCI6XCI3YmJkOTAwZGE0NGRkYzdjN2Q0MjEwMjM1Y2RmYWE3ZTZlYjMyZDRhMDU3NWMyMjQ0OTdiZTcyMTVmZTBmZWM5XCIsXCJjaXBoZXJwYXJhbXNcIjp7XCJpdlwiOlwiYWYwYWJhMmY5MWI5YmY4OTJkODVjYWJhODhkZDY2N2ZcIn0sXCJrZGZcIjpcInNjcnlwdFwiLFwia2RmcGFyYW1zXCI6e1wiZGtsZW5cIjozMixcIm5cIjoyNjIxNDQsXCJwXCI6MSxcInJcIjo4LFwic2FsdFwiOlwiNjRkM2I0MjNmNTQ3YzdmN2I2MzUzMDBmNzY3ODM2ZDdkZGQzNzQ2ZTk2MTAzZGJjZjEzZDE4MWIzZWY3NWQ3ZlwifSxcIm1hY1wiOlwiMDU1ZGQyOGU1Y2E2ODFjMDdmYTVhYmEwOGZlZTYzMTNhOTRmNzM5ZmUxMWJmN2MzODQ1OTNiNWQxMTIwNmFjZlwifSxcImlkXCI6XCIxYzhmM2IxYy02OTM4LTQzZGItOWI0MS00MmQ1Mzk1NDg3ZTRcIixcInZlcnNpb25cIjozfVxuIn0sIjB4NzFiMDExYjY3ZGM4ZjVjMzIzYTM0Y2QxNGI5NTI3MjFkNTc1MGM5MyI6eyJhY2NvdW50TmFtZSI6IkFsaWNlIiwiYWNjb3VudEFkZHJlc3MiOiIweDcxYjAxMWI2N2RjOGY1YzMyM2EzNGNkMTRiOTUyNzIxZDU3NTBjOTMiLCJlbmNyeXB0ZWRQcml2YXRlS2V5Ijoie1wiYWRkcmVzc1wiOlwiNzFiMDExYjY3ZGM4ZjVjMzIzYTM0Y2QxNGI5NTI3MjFkNTc1MGM5M1wiLFwiY3J5cHRvXCI6e1wiY2lwaGVyXCI6XCJhZXMtMTI4LWN0clwiLFwiY2lwaGVydGV4dFwiOlwiNzY4YzBiMjY0NzY3OTNlNTJjN2UyOTJiNmIyMjFmYTRkN2Y4MmE3ZDIwYTdjY2MwNDJjZTQzYzA3MmY5N2YzOFwiLFwiY2lwaGVycGFyYW1zXCI6e1wiaXZcIjpcIjA0OWUyYmVkNjk1NzNmNjJkYTY1NzZjMjE3NjliNTIwXCJ9LFwia2RmXCI6XCJzY3J5cHRcIixcImtkZnBhcmFtc1wiOntcImRrbGVuXCI6MzIsXCJuXCI6MjYyMTQ0LFwicFwiOjEsXCJyXCI6OCxcInNhbHRcIjpcIjMzMmIwZjc3MzBjNTgwYWE4NmIzZWM4ZTc5ZDIyOGU5Zjc2NDI2YmIzMjhjNDY4Y2I1N2U5OWUzOTEzMmMyOWZcIn0sXCJtYWNcIjpcIjM2MDc5YjdmMzJlZGYxYzNkOGQxNjk3MzEzZjgwODhjNzhiZTA3NjI3ZmZiNjQyMWY2NTU0MDkzNzNmZGVkNzlcIn0sXCJpZFwiOlwiODE4MWQ4MTItYWI1ZS00ZTViLWIwMjMtZTkwNDljMmFlYzQ4XCIsXCJ2ZXJzaW9uXCI6M31cbiJ9fQ");
      global.localStorage.setItem("currentAccount", "0x71b011b67dc8f5c323a34cd14b952721d5750c93");
    });

    test("Switch account", () => {
      store.dispatch(SwitchAccount({ accountAddress: "0x1cb99a5e4ccead43e98f61d25932bca5bf572484" }));

      expect(store.getActions()).toMatchSnapshot();
    });

    test("Switch account - Case insensitive", () => {
      store.dispatch(SwitchAccount({ accountAddress: "0x1cB99a5E4cCEAd43e98F61d25932bCA5bf572484" }));

      expect(store.getActions()).toMatchSnapshot();
    });

    test("ERROR: Unknown/invalid account address", () => {
      store.dispatch(SwitchAccount({ accountAddress: "0xe5e609074b7b8b947dcf9cf87805c9192f960a4e" }));

      expect(store.getActions()).toMatchSnapshot();
    });
  });

  describe("Remove Account", () =>{
    beforeEach(() => {
      // Set accounts localstorage to contain two accounts, Alice (0x71b011B67dc8f5C323A34Cd14b952721D5750C93)
      // and Bob (0x1cb99a5e4ccead43e98f61d25932bca5bf572484) with the former set as the current user
      global.localStorage.setItem("accounts", "eyIweDcxYjAxMUI2N2RjOGY1QzMyM0EzNENkMTRiOTUyNzIxRDU3NTBDOTMiOnsiYWNjb3VudE5hbWUiOiJBbGljZSIsImFjY291bnRBZGRyZXNzIjoiMHg3MWIwMTFCNjdkYzhmNUMzMjNBMzRDZDE0Yjk1MjcyMUQ1NzUwQzkzIiwiZW5jcnlwdGVkUHJpdmF0ZUtleSI6IntcImFkZHJlc3NcIjpcIjcxYjAxMWI2N2RjOGY1YzMyM2EzNGNkMTRiOTUyNzIxZDU3NTBjOTNcIixcImNyeXB0b1wiOntcImNpcGhlclwiOlwiYWVzLTEyOC1jdHJcIixcImNpcGhlcnRleHRcIjpcIjc2OGMwYjI2NDc2NzkzZTUyYzdlMjkyYjZiMjIxZmE0ZDdmODJhN2QyMGE3Y2NjMDQyY2U0M2MwNzJmOTdmMzhcIixcImNpcGhlcnBhcmFtc1wiOntcIml2XCI6XCIwNDllMmJlZDY5NTczZjYyZGE2NTc2YzIxNzY5YjUyMFwifSxcImtkZlwiOlwic2NyeXB0XCIsXCJrZGZwYXJhbXNcIjp7XCJka2xlblwiOjMyLFwiblwiOjI2MjE0NCxcInBcIjoxLFwiclwiOjgsXCJzYWx0XCI6XCIzMzJiMGY3NzMwYzU4MGFhODZiM2VjOGU3OWQyMjhlOWY3NjQyNmJiMzI4YzQ2OGNiNTdlOTllMzkxMzJjMjlmXCJ9LFwibWFjXCI6XCIzNjA3OWI3ZjMyZWRmMWMzZDhkMTY5NzMxM2Y4MDg4Yzc4YmUwNzYyN2ZmYjY0MjFmNjU1NDA5MzczZmRlZDc5XCJ9LFwiaWRcIjpcIjgxODFkODEyLWFiNWUtNGU1Yi1iMDIzLWU5MDQ5YzJhZWM0OFwiLFwidmVyc2lvblwiOjN9In0sIjB4MWNiOTlhNWU0Y2NlYWQ0M2U5OGY2MWQyNTkzMmJjYTViZjU3MjQ4NCI6eyJhY2NvdW50TmFtZSI6IkJvYiIsImFjY291bnRBZGRyZXNzIjoiMHgxY2I5OWE1ZTRjY2VhZDQzZTk4ZjYxZDI1OTMyYmNhNWJmNTcyNDg0IiwiZW5jcnlwdGVkUHJpdmF0ZUtleSI6IntcImFkZHJlc3NcIjpcIjFjYjk5YTVlNGNjZWFkNDNlOThmNjFkMjU5MzJiY2E1YmY1NzI0ODRcIixcImNyeXB0b1wiOntcImNpcGhlclwiOlwiYWVzLTEyOC1jdHJcIixcImNpcGhlcnRleHRcIjpcIjdiYmQ5MDBkYTQ0ZGRjN2M3ZDQyMTAyMzVjZGZhYTdlNmViMzJkNGEwNTc1YzIyNDQ5N2JlNzIxNWZlMGZlYzlcIixcImNpcGhlcnBhcmFtc1wiOntcIml2XCI6XCJhZjBhYmEyZjkxYjliZjg5MmQ4NWNhYmE4OGRkNjY3ZlwifSxcImtkZlwiOlwic2NyeXB0XCIsXCJrZGZwYXJhbXNcIjp7XCJka2xlblwiOjMyLFwiblwiOjI2MjE0NCxcInBcIjoxLFwiclwiOjgsXCJzYWx0XCI6XCI2NGQzYjQyM2Y1NDdjN2Y3YjYzNTMwMGY3Njc4MzZkN2RkZDM3NDZlOTYxMDNkYmNmMTNkMTgxYjNlZjc1ZDdmXCJ9LFwibWFjXCI6XCIwNTVkZDI4ZTVjYTY4MWMwN2ZhNWFiYTA4ZmVlNjMxM2E5NGY3MzlmZTExYmY3YzM4NDU5M2I1ZDExMjA2YWNmXCJ9LFwiaWRcIjpcIjFjOGYzYjFjLTY5MzgtNDNkYi05YjQxLTQyZDUzOTU0ODdlNFwiLFwidmVyc2lvblwiOjN9In19");
      global.localStorage.setItem("currentAccount", "0x71b011b67dc8f5c323a34cd14b952721d5750c93");

      wallet = new ElvWallet();
      wallet.AddAccount({
        accountName: "Alice",
        privateKey: "0x0000000000000000000000000000000000000000000000000000000000000000"
      });
      wallet.AddAccount({
        accountName: "Bob",
        privateKey: "0x2d953561666c11a5bec2b9d5fd1203f21eb0aff02b074daa4897fee6b4726a98"
      });
    });

    test("Remove account", () => {
      const accountAddress = "0x1cb99a5e4ccead43e98f61d25932bca5bf572484";
      store.dispatch(RemoveAccount({ accountAddress: accountAddress, wallet }));

      expect(store.getActions()).toMatchSnapshot();

      const storedAccounts = JSON.parse(atob(global.localStorage.getItem("accounts")));

      expect(storedAccounts[accountAddress]).toBe(undefined);
    });

    test("ERROR: Invalid account address", () => {
      const accountAddress = "0xe5e609074b7b8b947dcf9cf87805c9192f960a4e";
      const originalStoredAccounts = global.localStorage.getItem("accounts");

      store.dispatch(RemoveAccount({ accountAddress: accountAddress }));

      expect(store.getActions()).toMatchSnapshot();

      // Localstorage accounts should not be changed
      expect(global.localStorage.getItem("accounts")).toBe(originalStoredAccounts);
    });
  });

  describe("Log out", () => {
    beforeEach(() => {
      wallet = new ElvWallet();
    });

    test("Log out - No other accounts", () => {
      // Only 0x71b011B67dc8f5C323A34Cd14b952721D5750C93 logged in
      global.localStorage.setItem("accounts", "eyIweDcxYjAxMWI2N2RjOGY1YzMyM2EzNGNkMTRiOTUyNzIxZDU3NTBjOTMiOnsiYWNjb3VudE5hbWUiOiJBbGljZSIsImFjY291bnRBZGRyZXNzIjoiMHg3MWIwMTFiNjdkYzhmNWMzMjNhMzRjZDE0Yjk1MjcyMWQ1NzUwYzkzIiwiZW5jcnlwdGVkUHJpdmF0ZUtleSI6IntcImFkZHJlc3NcIjpcIjcxYjAxMWI2N2RjOGY1YzMyM2EzNGNkMTRiOTUyNzIxZDU3NTBjOTNcIixcImNyeXB0b1wiOntcImNpcGhlclwiOlwiYWVzLTEyOC1jdHJcIixcImNpcGhlcnRleHRcIjpcIjc2OGMwYjI2NDc2NzkzZTUyYzdlMjkyYjZiMjIxZmE0ZDdmODJhN2QyMGE3Y2NjMDQyY2U0M2MwNzJmOTdmMzhcIixcImNpcGhlcnBhcmFtc1wiOntcIml2XCI6XCIwNDllMmJlZDY5NTczZjYyZGE2NTc2YzIxNzY5YjUyMFwifSxcImtkZlwiOlwic2NyeXB0XCIsXCJrZGZwYXJhbXNcIjp7XCJka2xlblwiOjMyLFwiblwiOjI2MjE0NCxcInBcIjoxLFwiclwiOjgsXCJzYWx0XCI6XCIzMzJiMGY3NzMwYzU4MGFhODZiM2VjOGU3OWQyMjhlOWY3NjQyNmJiMzI4YzQ2OGNiNTdlOTllMzkxMzJjMjlmXCJ9LFwibWFjXCI6XCIzNjA3OWI3ZjMyZWRmMWMzZDhkMTY5NzMxM2Y4MDg4Yzc4YmUwNzYyN2ZmYjY0MjFmNjU1NDA5MzczZmRlZDc5XCJ9LFwiaWRcIjpcIjgxODFkODEyLWFiNWUtNGU1Yi1iMDIzLWU5MDQ5YzJhZWM0OFwiLFwidmVyc2lvblwiOjN9In19");
      global.localStorage.setItem("currentAccount", "0x71b011b67dc8f5c323a34cd14b952721d5750c93");

      wallet.AddAccount({
        accountName: "Alice",
        privateKey: "0x0000000000000000000000000000000000000000000000000000000000000000"
      });

      store.dispatch(LogOut({ wallet }));

      expect(store.getActions()).toMatchSnapshot();

      expect(global.localStorage.getItem("currentAccount")).toBe(null);
    });

    test("Log out - Automatically switch to next account", () => {
      // Set accounts localstorage to contain two accounts, 0x71b011B67dc8f5C323A34Cd14b952721D5750C93 and 0x1cb99a5e4ccead43e98f61d25932bca5bf572484
      // with the former set as the current user
      global.localStorage.setItem("accounts", "eyIweDFjYjk5YTVlNGNjZWFkNDNlOThmNjFkMjU5MzJiY2E1YmY1NzI0ODQiOnsiYWNjb3VudE5hbWUiOiJCb2IiLCJhY2NvdW50QWRkcmVzcyI6IjB4MWNiOTlhNWU0Y2NlYWQ0M2U5OGY2MWQyNTkzMmJjYTViZjU3MjQ4NCIsImVuY3J5cHRlZFByaXZhdGVLZXkiOiJ7XCJhZGRyZXNzXCI6XCIxY2I5OWE1ZTRjY2VhZDQzZTk4ZjYxZDI1OTMyYmNhNWJmNTcyNDg0XCIsXCJjcnlwdG9cIjp7XCJjaXBoZXJcIjpcImFlcy0xMjgtY3RyXCIsXCJjaXBoZXJ0ZXh0XCI6XCI3YmJkOTAwZGE0NGRkYzdjN2Q0MjEwMjM1Y2RmYWE3ZTZlYjMyZDRhMDU3NWMyMjQ0OTdiZTcyMTVmZTBmZWM5XCIsXCJjaXBoZXJwYXJhbXNcIjp7XCJpdlwiOlwiYWYwYWJhMmY5MWI5YmY4OTJkODVjYWJhODhkZDY2N2ZcIn0sXCJrZGZcIjpcInNjcnlwdFwiLFwia2RmcGFyYW1zXCI6e1wiZGtsZW5cIjozMixcIm5cIjoyNjIxNDQsXCJwXCI6MSxcInJcIjo4LFwic2FsdFwiOlwiNjRkM2I0MjNmNTQ3YzdmN2I2MzUzMDBmNzY3ODM2ZDdkZGQzNzQ2ZTk2MTAzZGJjZjEzZDE4MWIzZWY3NWQ3ZlwifSxcIm1hY1wiOlwiMDU1ZGQyOGU1Y2E2ODFjMDdmYTVhYmEwOGZlZTYzMTNhOTRmNzM5ZmUxMWJmN2MzODQ1OTNiNWQxMTIwNmFjZlwifSxcImlkXCI6XCIxYzhmM2IxYy02OTM4LTQzZGItOWI0MS00MmQ1Mzk1NDg3ZTRcIixcInZlcnNpb25cIjozfVxuIn0sIjB4NzFiMDExYjY3ZGM4ZjVjMzIzYTM0Y2QxNGI5NTI3MjFkNTc1MGM5MyI6eyJhY2NvdW50TmFtZSI6IkFsaWNlIiwiYWNjb3VudEFkZHJlc3MiOiIweDcxYjAxMWI2N2RjOGY1YzMyM2EzNGNkMTRiOTUyNzIxZDU3NTBjOTMiLCJlbmNyeXB0ZWRQcml2YXRlS2V5Ijoie1wiYWRkcmVzc1wiOlwiNzFiMDExYjY3ZGM4ZjVjMzIzYTM0Y2QxNGI5NTI3MjFkNTc1MGM5M1wiLFwiY3J5cHRvXCI6e1wiY2lwaGVyXCI6XCJhZXMtMTI4LWN0clwiLFwiY2lwaGVydGV4dFwiOlwiNzY4YzBiMjY0NzY3OTNlNTJjN2UyOTJiNmIyMjFmYTRkN2Y4MmE3ZDIwYTdjY2MwNDJjZTQzYzA3MmY5N2YzOFwiLFwiY2lwaGVycGFyYW1zXCI6e1wiaXZcIjpcIjA0OWUyYmVkNjk1NzNmNjJkYTY1NzZjMjE3NjliNTIwXCJ9LFwia2RmXCI6XCJzY3J5cHRcIixcImtkZnBhcmFtc1wiOntcImRrbGVuXCI6MzIsXCJuXCI6MjYyMTQ0LFwicFwiOjEsXCJyXCI6OCxcInNhbHRcIjpcIjMzMmIwZjc3MzBjNTgwYWE4NmIzZWM4ZTc5ZDIyOGU5Zjc2NDI2YmIzMjhjNDY4Y2I1N2U5OWUzOTEzMmMyOWZcIn0sXCJtYWNcIjpcIjM2MDc5YjdmMzJlZGYxYzNkOGQxNjk3MzEzZjgwODhjNzhiZTA3NjI3ZmZiNjQyMWY2NTU0MDkzNzNmZGVkNzlcIn0sXCJpZFwiOlwiODE4MWQ4MTItYWI1ZS00ZTViLWIwMjMtZTkwNDljMmFlYzQ4XCIsXCJ2ZXJzaW9uXCI6M31cbiJ9fQ");
      global.localStorage.setItem("currentAccount", "0x71b011b67dc8f5c323a34cd14b952721d5750c93");
      wallet.AddAccount({
        accountName: "Alice",
        privateKey: "0x0000000000000000000000000000000000000000000000000000000000000000"
      });
      wallet.AddAccount({
        accountName: "Bob",
        privateKey: "0x2d953561666c11a5bec2b9d5fd1203f21eb0aff02b074daa4897fee6b4726a98"
      });

      store.dispatch(LogOut({ wallet }));

      expect(store.getActions()).toMatchSnapshot();

      expect(global.localStorage.getItem("currentAccount")).toBe("0x1cb99a5e4ccead43e98f61d25932bca5bf572484");
    });

    test("ERROR: Not logged in", () => {
      global.localStorage.clear();

      store.dispatch(LogOut({ wallet }));

      expect(store.getActions()).toMatchSnapshot();
    });
  });
});
