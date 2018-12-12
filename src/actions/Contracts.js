import ActionTypes from "./ActionTypes";
import Fabric from "../clients/Fabric";
import { SetNotificationMessage } from "./Notifications";

// TODO: Get this thing to work like a normal module
import "browser-solc";

export const ListContracts = () => {
  return async (dispatch) => {
    dispatch({
      type: ActionTypes.contracts.list,
      contracts: await Fabric.FabricBrowser.Contracts()
    });
  };
};

export const ListDeployedContracts = () => {
  return async (dispatch) => {
    dispatch({
      type: ActionTypes.contracts.deployed.list,
      contracts: await Fabric.FabricBrowser.DeployedContracts()
    });
  };
};

export const RemoveContract = ({name}) => {
  return async (dispatch) => {
    await Fabric.FabricBrowser.RemoveContract({name});

    dispatch(SetNotificationMessage({
      message: "Successfully removed contract",
      redirect: true
    }));
  };
};

export const RemoveDeployedContract = ({name}) => {
  return async (dispatch) => {
    await Fabric.FabricBrowser.RemoveDeployedContract({name});

    dispatch(SetNotificationMessage({
      message: "Successfully removed contract",
      redirect: true
    }));
  };
};

export const CompileContracts = (contractFiles) => {
  return async (dispatch) => {
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
            type: ActionTypes.contracts.error.compile,
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
            type: ActionTypes.contracts.compile,
            contractData
          });

          resolve();
        }
      });
    });
  };
};

export const SaveContract = ({name, oldContractName, description, abi, bytecode}) => {
  return async (dispatch) => {
    await Fabric.FabricBrowser.AddContract({
      name,
      description,
      abi,
      bytecode
    });

    if(oldContractName && oldContractName !== name) {
      await Fabric.FabricBrowser.RemoveContract({
        name: oldContractName
      });
    }

    dispatch(SetNotificationMessage({
      message: "Successfully saved contract",
      redirect: true
    }));
  };
};

export const DeployContract = ({
  contractName,
  contractDescription,
  abi,
  bytecode,
  inputs
}) => {
  return async (dispatch) => {
    const owner = await Fabric.CurrentAccountAddress();

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

    await Fabric.FabricBrowser.AddDeployedContract({
      name: contractName,
      description: contractDescription,
      address: contractInfo.contractAddress,
      abi,
      bytecode,
      inputs,
      owner
    });

    dispatch(SetNotificationMessage({
      message: "Successfully deployed custom contract",
      redirect: true
    }));

    return contractInfo.contractAddress;
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
  return async (dispatch) => {
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

    dispatch(SetNotificationMessage({
      message: "Successfully deployed custom contract",
      redirect: true
    }));
  };
};

export const GetContractEvents = ({objectId, contractAddress, abi}) => {
  return async (dispatch) => {
    let events;
    if(objectId && !contractAddress) {
      contractAddress = Fabric.utils.HashToAddress({hash: objectId});
      events = await Fabric.ContentObjectContractEvents({objectId});
    } else {
      events = await Fabric.ContractEvents({contractAddress, abi});
    }

    dispatch({
      type: ActionTypes.contracts.deployed.events,
      contractAddress,
      events: events.reverse()
    });
  };
};

export const CallContractMethod = ({
  contractAddress,
  abi,
  methodName,
  methodArgs
}) => {
  return async (dispatch) => {
    const method = Object.values(abi).find(entry => entry.type === "function" && entry.name === methodName);

    if(methodArgs.length > 0) {
      methodArgs = await Fabric.FormatContractArguments({
        abi,
        methodName,
        args: methodArgs
      });
    }

    const methodResults = await Fabric.CallContractMethod({
      contractAddress,
      abi,
      methodName,
      methodArgs
    });

    dispatch({
      type: ActionTypes.contracts.deployed.call,
      contractAddress,
      methodName,
      methodResults
    });

    dispatch(SetNotificationMessage({
      message: `Successfully called method "${methodName}"`,
      redirect: !method.constant
    }));
  };
};

export const GetContractBalance = ({contractAddress})=> {
  return async (dispatch) => {
    const balance = await Fabric.GetBalance({address: contractAddress});

    dispatch({
      type: ActionTypes.contracts.deployed.balance,
      contractAddress,
      balance
    });
  };
};

export const SendFunds = ({sender, recipient, ether}) => {
  return async (dispatch) => {
    await Fabric.SendFunds({sender, recipient, ether});

    dispatch(SetNotificationMessage({
      message: "Successfully sent " + ether + " Eluvio Bux to " + recipient,
      redirect: true
    }));
  };
};

export const WithdrawContractFunds = ({contractAddress, abi, ether}) => {
  return async (dispatch) => {
    await Fabric.WithdrawContractFunds({contractAddress, abi, ether});

    dispatch(SetNotificationMessage({
      message: "Successfully withdrew " + ether + " Eluvio Bux from contract",
      redirect: true
    }));
  };
};
