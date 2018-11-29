import ActionTypes from "./ActionTypes";
import Fabric from "../clients/Fabric";
import { SetNotificationMessage } from "./Notifications";
import { WrapRequest } from "./Requests";

// TODO: Get this thing to work like a normal module
import "browser-solc";

export const ListContracts = () => {
  return (dispatch) => {
    return WrapRequest({
      dispatch: dispatch,
      action: "listContracts",
      todo: (async () => {
        dispatch({
          type: ActionTypes.request.contracts.completed.list,
          contracts: await Fabric.FabricBrowser.Contracts()
        });
      })
    });
  };
};

export const RemoveContract = ({name}) => {
  return (dispatch) => {
    return WrapRequest({
      dispatch: dispatch,
      action: "removeContract",
      todo: (async () => {
        await Fabric.FabricBrowser.RemoveContract({name});

        dispatch(SetNotificationMessage({
          message: "Contract successfully deleted",
          redirect: true
        }));

        // Reload contracts
        dispatch(ListContracts());
      })
    });
  };
};

export const CompileContracts = (contractFiles) => {
  return (dispatch) => {
    return WrapRequest({
      dispatch: dispatch,
      action: "compileContracts",
      todo: (async () => {
        let sources = {};
        for(const file of contractFiles) {
          sources[file.name] = await new Response(file).text();
        }

        await new Promise((resolve, reject) => {
          BrowserSolc.loadVersion("soljson-v0.4.21+commit.dfe3193c.js", (compiler) => {
            const output = compiler.compile({sources}, 1);
            const errors = output.errors || [];

            if(errors.some(error => { return !error.includes("Warning:"); })) {
              dispatch({
                type: ActionTypes.request.contracts.error.compile,
                errors: output.errors
              });

              // Compilation error
              reject("Compilation errors");
            } else {
              // Compilation successful

              dispatch(SetNotificationMessage({
                message: "Compilation successful",
                redirect: true
              }));

              // Pull out relevant data
              let contractData = {};
              Object.keys(output.contracts).map(contractName => {
                const contract = output.contracts[contractName];
                contractData[contractName] = {
                  bytecode: contract.bytecode,
                  interface: JSON.parse(contract.interface),
                  gasEstimates: contract.gasEstimates
                };
              });

              dispatch({
                type: ActionTypes.request.contracts.completed.compile,
                contractData
              });

              resolve();
            }
          });
        });
      })
    });
  };
};

export const SaveContract = ({name, oldContractName, description, abi, bytecode}) => {
  return (dispatch) => {
    return WrapRequest({
      dispatch: dispatch,
      action: "saveContract",
      todo: (async () => {
        await Fabric.FabricBrowser.AddContract({
          name,
          description,
          abi,
          bytecode
        });

        // TODO: Handle this better
        if(oldContractName && oldContractName !== name) {
          await Fabric.FabricBrowser.RemoveContract({
            name: oldContractName
          });
        }

        dispatch(SetNotificationMessage({
          message: "Contract successfully saved",
          redirect: true
        }));
      })
    });
  };
};

export const DeployContentContract = ({
  libraryId,
  objectId,
  contractName,
  contractDescription,
  abi,
  bytecode,
  inputs
}) => {
  return (dispatch) => {
    return WrapRequest({
      dispatch: dispatch,
      action: "deployContentContract",
      todo: (async () => {
        let constructorArgs = [];
        if(inputs.length > 0) {
          constructorArgs = await Fabric.FormatContractArguments({
            abi,
            methodName: "constructor",
            args: inputs
          });
        }

        const contractInfo = await Fabric.DeployContract({
          abi,
          bytecode,
          constructorArgs
        });

        await Fabric.SetCustomContentContract({
          objectId,
          customContractAddress: contractInfo.contractAddress,
          overrides: { gasLimit: 60000000, gasPrice: 1000000 },
        });

        // Custom contract successfully deployed and set - update metadata
        const editResponse = await Fabric.EditContentObject({
          libraryId,
          objectId
        });

        await Fabric.ReplaceMetadata({
          libraryId,
          objectId,
          writeToken: editResponse.write_token,
          metadataSubtree: "customContract",
          metadata: {
            name: contractName,
            description: contractDescription,
            address: contractInfo.contractAddress,
            abi
          }
        });

        await Fabric.FinalizeContentObject({
          libraryId,
          objectId,
          writeToken: editResponse.write_token
        });

        dispatch({
          type: ActionTypes.request.contracts.completed.deploy,
          contractInfo
        });

        dispatch(SetNotificationMessage({
          message: "Contract successfully deployed",
          redirect: true
        }));
      })
    });
  };
};

export const GetContractEvents = ({objectId, contractAddress, abi}) => {
  return (dispatch) => {
    return WrapRequest({
      dispatch: dispatch,
      action: "getContractEvents",
      todo: (async () => {
        let events;
        if(objectId && !contractAddress) {
          contractAddress = Fabric.utils.HashToAddress({hash: objectId});
          events = await Fabric.ContentObjectContractEvents({objectId});
        } else {
          events = await Fabric.ContractEvents({contractAddress, abi});
        }

        dispatch({
          type: ActionTypes.request.content.completed.list.contentObjectEvents,
          objectId,
          contractAddress,
          events: events.reverse()
        });
      })
    });
  };
};

export const CallContractMethod = ({
  contractAddress,
  abi,
  methodName,
  methodArgs
}) => {
  return (dispatch) => {
    return WrapRequest({
      dispatch: dispatch,
      action: "callContractMethod",
      todo: (async () => {
        if(methodArgs.length > 0) {
          methodArgs = await Fabric.FormatContractArguments({
            abi,
            methodName,
            args: methodArgs
          });
        }

        const result = await Fabric.CallContractMethod({
          contractAddress,
          abi,
          methodName,
          methodArgs
        });

        dispatch({
          type: ActionTypes.request.content.completed.contract.call,
          contractAddress,
          methodName,
          result
        });

        dispatch(SetNotificationMessage({
          message: "Method successfully called",
          redirect: true
        }));
      })
    });
  };
};
