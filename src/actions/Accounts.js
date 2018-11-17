import ActionTypes from "./ActionTypes";
import Fabric from "../clients/Fabric";
import { SetNotificationMessage } from "./Notifications";
import { WrapRequest } from "./Requests";

export const ListAccounts = () => {
  return (dispatch) => {
    return WrapRequest({
      dispatch: dispatch,
      domain: "accounts",
      action: "listAccounts",
      todo: async () => {
        /*
        let accountAddresses = await Ethereum.ListAccounts();

        let accounts = {};
        accountAddresses.forEach(
          (address) => { accounts[address] = {}; }
        );

        dispatch({
          type: ActionTypes.request.accounts.completed.list.accounts,
          accounts: accounts
        });
        */
      }
    });
  };
};

export const CreateAccount = ({password}) => {
  return (dispatch) => {
    return WrapRequest({
      dispatch: dispatch,
      domain: "accounts",
      action: "createAccount",
      todo: async () => {
        /*
        let accountAddress = await Ethereum.CreateAccount({ password: password });

        dispatch(SetNotificationMessage({
          message: "Successfully created account '" + accountAddress + "'",
          redirect: true
        }));
        */
      }
    });
  };
};

export const GetAccountInfo = ({accountAddress}) => {
  return (dispatch) => {
    return WrapRequest({
      dispatch: dispatch,
      domain: "accounts",
      action: "getAccountInfo",
      todo: async () => {
        /*
        let libraryResponse = await Fabric.GetByName({name: "ElvAccountInfo" });
        let accountObject = await Fabric.GetObjectByName({name: accountAddress});
        accountObject.libraryId = libraryResponse.target;

        accountObject.accountBalance = await Ethereum.Balance(accountAddress);
        accountObject.accountTransactionCount = await Ethereum.TransactionCount(accountAddress);

        dispatch({
          type: ActionTypes.request.accounts.completed.list.account,
          accountAddress,
          accountInfo: accountObject
        });
        */
      }
    });
  };
};

export const UpdateAccountInfo = ({
  accountAddress,
  name,
  profileImageFile,
  bio
}) => {
  return (dispatch) => {
    return WrapRequest({
      dispatch: dispatch,
      domain: "accounts",
      action: "updateAccountInfo",
      todo: async () => {
        // TODO: This should be replaced by some sort of first class fabric API for storing account info
        // For now, this library needs to be created and named manually
        let accountLibraryInfo = await Fabric.GetByName({name: "ElvAccountInfo"});
        if(!accountLibraryInfo) {
          console.log("Create the account info library and use naming service to name it ElvAccountInfo");
          throw Error();
        }
        let libraryId = accountLibraryInfo.target;

        let accountInfoObject = await Fabric.GetObjectByName({name: accountAddress});

        let writeToken;

        if(accountInfoObject) {
          // Edit existing info object
          let editResponse = await Fabric.EditContentObject({
            libraryId,
            objectId: accountInfoObject.objectId
          });

          writeToken = editResponse.write_token;

          await Fabric.MergeMetadata({
            libraryId,
            objectId: accountInfoObject.objectId,
            writeToken,
            metadata: {
              name,
              bio
            }
          });
        } else {
          // Create new info object
          let createResponse = await Fabric.CreateContentObject({
            libraryId,
            name: "Account Info: " + accountAddress,
            metadata: {
              name,
              bio
            }
          });
          writeToken = createResponse.write_token;
        }

        if(profileImageFile) {
          const imageData = await new Response(profileImageFile).blob();
          const uploadResponse = await Fabric.UploadPart({
            libraryId,
            objectId: accountInfoObject.objectId,
            writeToken,
            data: imageData
          });

          await Fabric.MergeMetadata({
            libraryId,
            objectId: accountInfoObject.objectId,
            writeToken,
            metadata: {
              profileImageHash: uploadResponse.part.hash
            }
          });
        }

        // TODO: IMAGE

        let finalizeResponse = await Fabric.FinalizeContentObject({
          libraryId,
          objectId: accountInfoObject.objectId,
          writeToken
        });

        await Fabric.SetObjectByName({
          name: accountAddress,
          libraryId,
          objectId: finalizeResponse.id
        });

        dispatch(SetNotificationMessage({
          message: "Successfully updated account info",
          redirect: true
        }));
      }
    });
  };
};









