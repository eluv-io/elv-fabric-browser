import ActionTypes from "./ActionTypes";
import Fabric from "../clients/Fabric";
import { SetNotificationMessage } from "./Notifications";
import { WrapRequest } from "./Requests";

// TODO: Get this thing to work like a normal module
import "browser-solc";

export const CompileContracts = (contractFiles) => {
  return (dispatch) => {
    return WrapRequest({
      dispatch: dispatch,
      domain: "contracts",
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


export const DeployContract = ({abi, bytecode, inputs}) => {
  return (dispatch) => {
    return WrapRequest({
      dispatch: dispatch,
      domain: "contracts",
      action: "compileContracts",
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
