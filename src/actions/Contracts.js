import ActionTypes from "./ActionTypes";
import Fabric from "../clients/Fabric";
import { SetNotificationMessage } from "./Notifications";

// TODO: Get this thing to work like a normal module
import "browser-solc";
import { FormatAddress } from "../utils/Helpers";
import { ParseInputJson } from "../utils/Input";

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

export const RemoveDeployedContract = ({address}) => {
  return async (dispatch) => {
    await Fabric.FabricBrowser.RemoveDeployedContract({address});

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

export const WatchContract = ({name, address, description, abi}) => {
  return async (dispatch) => {
    address = FormatAddress(address);
    abi = ParseInputJson(abi);
    const owner = await Fabric.CurrentAccountAddress();

    try {
      // Try to get balance of contract to check existence of entity at given address
      await Fabric.GetBalance({address});
    } catch(e) {
      throw Error("Unable to connect to contract at " + address);
    }

    await Fabric.FabricBrowser.AddDeployedContract({
      name,
      description,
      address,
      abi,
      owner
    });

    dispatch(SetNotificationMessage({
      message: "Successfully added watched contract",
      redirect: true
    }));
  };
};

export const DeployContract = ({
  contractName,
  contractDescription,
  abi,
  bytecode,
  inputs,
  funds
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

    if(funds) {
      await Fabric.SendFunds({
        sender: Fabric.CurrentAccountAddress(),
        recipient: contractInfo.contractAddress,
        ether: funds
      });
    }

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

    return FormatAddress(contractInfo.contractAddress);
  };
};

export const DeployContentContract = ({
  libraryId,
  objectId,
  contractName,
  contractDescription,
  abi,
  bytecode,
  inputs,
  funds
}) => {
  return async (dispatch) => {
    const isContentType = libraryId === Fabric.contentSpaceLibraryId;

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

    // Content types don't have a hook to associate custom contracts
    if(!isContentType) {
      await Fabric.SetCustomContentContract({
        objectId,
        customContractAddress: contractInfo.contractAddress,
        overrides: {gasLimit: 60000000, gasPrice: 1000000},
      });
    }

    if(funds) {
      if(funds) {
        await Fabric.SendFunds({
          sender: Fabric.CurrentAccountAddress(),
          recipient: contractInfo.contractAddress,
          ether: funds
        });
      }
    }

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

    return FormatAddress(contractInfo.contractAddress);
  };
};

export const GetContractEvents = ({contractAddress, abi, fromBlock=0, toBlock}) => {
  return async (dispatch) => {
    dispatch({
      type: ActionTypes.contracts.deployed.events,
      contractAddress,
      blocks: await Fabric.ContractEvents({contractAddress, abi, fromBlock, toBlock})
    });
  };
};

export const ClearContractEvents = ({contractAddress}) => {
  return async (dispatch) => {
    dispatch({
      type: ActionTypes.contracts.deployed.clearEvents,
      contractAddress
    });
  };
};

export const GetBlockchainEvents = ({toBlock, fromBlock, count=10}) => {
  return async (dispatch) => {
    dispatch({
      type: ActionTypes.logs.list,
      blocks: await Fabric.GetBlockchainEvents({toBlock, fromBlock, count})
    });
  };
};

export const ClearBlockchainEvents = () => {
  return async (dispatch) => {
    dispatch({
      type: ActionTypes.logs.clear
    });
  };
};

export const CallContractMethod = ({
  contractAddress,
  abi,
  methodName,
  methodArgs,
  value=0
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

    let methodResults;
    if(method.constant) {
      methodResults = await Fabric.CallContractMethod({
        contractAddress,
        abi,
        methodName,
        methodArgs,
        value
      });
    } else {
      const transactionInfo = await Fabric.CallContractMethodAndWait({
        contractAddress,
        abi,
        methodName,
        methodArgs,
        value
      });

      methodResults = await Fabric.ContractEvents({
        contractAddress,
        abi,
        fromBlock: transactionInfo.blockNumber,
        toBlock: transactionInfo.blockNumber
      });

      if(methodResults.length === 0){
        throw Error("Transaction failed");
      }

      methodResults = methodResults[0];
    }

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

    return balance;
  };
};

export const SendFunds = ({sender, recipient, ether}) => {
  return async (dispatch) => {
    await Fabric.SendFunds({sender, recipient, ether});

    dispatch(SetNotificationMessage({
      message: "Successfully sent φ" + ether + " to " + recipient,
      redirect: true
    }));
  };
};

export const WithdrawContractFunds = ({contractAddress, abi, ether}) => {
  return async (dispatch) => {
    await Fabric.WithdrawContractFunds({contractAddress, abi, ether});

    dispatch(SetNotificationMessage({
      message: "Successfully withdrew φ" + ether + " from contract",
      redirect: true
    }));
  };
};
