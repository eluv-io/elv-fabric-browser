import Fabric from "../clients/Fabric";
import {action, computed, flow, observable, toJS} from "mobx";
import {ContractTypes, DetermineContractInterface} from "../utils/Contracts";
import {ParseInputJson} from "elv-components-js";
import {FormatAddress} from "../utils/Helpers";
import UrlJoin from "url-join";

// eslint-disable-next-line no-unused-vars
import BrowserSolc from "browser-solc";
import {Cancelable} from "../utils/Cancelable";

class ContractStore {
  @observable contractAddress;

  @observable contracts = {};
  @observable contractsCount;

  @observable deployedContracts = {};
  @observable deployedContractsCount;

  @observable compiledContracts;

  @computed get contractName() {
    return this.rootStore.routerStore.contractName;
  }

  @computed get libraryId() {
    return this.rootStore.routerStore.libraryId;
  }

  @computed get objectId() {
    return this.rootStore.routerStore.objectId;
  }

  @computed get contract() {
    if(this.contractName) {
      return this.contracts[this.contractName];
    }

    return this.contracts[this.contractAddress] || this.deployedContracts[this.contractAddress];
  }

  constructor(rootStore) {
    this.rootStore = rootStore;
  }

  @action.bound
  ListContracts = flow(function * ({params}) {
    const {contracts, count} = yield Cancelable(
      params.cancelable,
      async() => Fabric.Contracts({params})
    );

    this.contracts = contracts;
    this.contractsCount = count;
  });

  @action.bound
  ListDeployedContracts = flow(function * ({params}) {
    const {contracts, count} = yield Cancelable(
      params.cancelable,
      async() => Fabric.DeployedContracts({params})
    );

    this.deployedContracts = contracts;
    this.deployedContractsCount = count;
  });

  @action.bound
  RemoveContract = flow(function * ({name}) {
    yield Fabric.RemoveContract({name});

    this.rootStore.notificationStore.SetNotificationMessage({
      message: "Successfully removed contract",
      redirect: true
    });
  });

  @action.bound
  RemoveDeployedContract = flow(function * ({address}) {
    yield Fabric.RemoveDeployedContract({address});

    this.rootStore.notificationStore.SetNotificationMessage({
      message: "Successfully removed contract",
      redirect: true
    });
  });

  @action.bound
  DeployedContractInfo = flow(function * () {
    const contractAddressParam = this.rootStore.routerStore.contractAddress;

    const path = this.rootStore.routerStore.path;

    const isAccessGroup = path.startsWith("/access-groups");
    const isCustomContentObjectContract = path.includes("custom-contract");

    let {type, description, abi, contractAddress} = DetermineContractInterface({
      libraryId: this.libraryId,
      objectId: this.objectId,
      contractAddressParam,
      isAccessGroup,
      isCustomContentObjectContract,
    });

    let name;
    switch(type) {
      case ContractTypes.library:
        yield this.rootStore.libraryStore.ContentLibrary({libraryId: this.libraryId});

        const library = this.rootStore.libraryStore.library.name || this.libraryId;
        name = `${library} - Content Library Contract`;

        break;

      case ContractTypes.customObject:
        contractAddress = yield Fabric.GetCustomContentContractAddress({
          libraryId: this.libraryId,
          objectId: this.objectId
        });

        abi = yield Fabric.GetContentObjectMetadata({
          libraryId: this.libraryId,
          objectId: this.objectId,
          metadataSubtree: UrlJoin("custom_contract", "abi")
        });

      // eslint-disable-next-line no-fallthrough
      case ContractTypes.object:
      case ContractTypes.contentType:
        yield this.rootStore.objectStore.ContentObject({
          libraryId: this.libraryId,
          objectId: this.objectId
        });

        const object = this.rootStore.objectStore.object.meta.name || this.objectId;
        name = `${object} - Content Object Contract`;

        break;

      case ContractTypes.accessGroup:
        yield this.rootStore.groupStore.ListAccessGroups({params: {paginate: false}});

        const accessGroup = this.rootStore.groupStore.accessGroup.name || "Access Group";
        name = `${accessGroup} - Access Group Contract`;

        break;

      case ContractTypes.unknown:
        yield this.ListDeployedContracts({params: {paginate: false}});

        abi = this.deployedContracts[contractAddress].abi;
        this.contractAddress = contractAddress;
        name = this.contract.name;
        break;
    }

    const balance = yield this.GetContractBalance({contractAddress});

    const contract = {
      type,
      name,
      balance,
      description,
      abi,
      contractAddress
    };

    this.contractAddress = contractAddress;
    this.contracts[contractAddress] = contract;

    return contract;
  });

  @action.bound
  CompileContracts = flow(function * (contractFiles)  {
    let sources = {};
    for(const file of contractFiles) {
      sources[file.name] = yield new Response(file).text();
    }

    this.compiledContracts = yield new Promise((resolve, reject) => {
      window.BrowserSolc.loadVersion("soljson-v0.4.24+commit.e67f0147.js", (compiler) => {
        const output = compiler.compile({sources}, 1);
        const errors = output.errors || [];

        if(errors.some(error => { return !error.includes("Warning:"); })) {
          // Compilation error
          reject(errors);
        } else {
          // Compilation successful
          this.rootStore.notificationStore.SetNotificationMessage({
            message: "Compilation successful",
            redirect: true
          });

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

          resolve(contractData);
        }
      });
    });
  });

  @action.bound
  SaveContract = flow(function * ({name, oldContractName, description, abi, bytecode}) {
    if(typeof abi === "string") {
      try {
        abi = ParseInputJson(abi);
      } catch(error) {
        throw `Invalid ABI: ${error.message}`;
      }
    }

    yield Fabric.AddContract({
      name: name.trim(),
      description,
      abi: toJS(abi),
      bytecode
    });

    if(oldContractName && oldContractName !== name) {
      yield Fabric.RemoveContract({
        name: oldContractName
      });
    }

    this.rootStore.notificationStore.SetNotificationMessage({
      message: "Successfully saved contract",
      redirect: true
    });
  });

  @action.bound
  WatchContract = flow(function * ({name, address, description, abi}) {
    address = FormatAddress(address);

    try {
      abi = ParseInputJson(abi);
    } catch(error) {
      throw `Invalid ABI: ${error.message}`;
    }

    const owner = yield Fabric.CurrentAccountAddress();

    try {
      // Try to get balance of contract to check existence of entity at given address
      yield Fabric.GetBalance({address});
    } catch(e) {
      throw Error("Unable to connect to contract at " + address);
    }

    yield Fabric.AddDeployedContract({
      name,
      description,
      address,
      abi,
      owner
    });

    this.rootStore.notificationStore.SetNotificationMessage({
      message: "Successfully added watched contract",
      redirect: true
    });
  });

  @action.bound
  DeployContract = flow(function * ({contractName, contractDescription, abi, bytecode, inputs, funds}) {
    try {
      const owner = yield Fabric.CurrentAccountAddress();

      abi = toJS(abi);

      let constructorArgs = [];
      if(inputs.length > 0) {
        constructorArgs = yield Fabric.FormatContractArguments({
          abi,
          methodName: "constructor",
          args: inputs
        });
      }

      const contractInfo = yield Fabric.DeployContract({
        abi,
        bytecode,
        constructorArgs
      });

      if(funds) {
        yield Fabric.SendFunds({
          recipient: contractInfo.contractAddress,
          ether: funds
        });
      }

      yield Fabric.AddDeployedContract({
        name: contractName,
        description: contractDescription,
        address: contractInfo.contractAddress,
        abi,
        bytecode,
        inputs,
        owner
      });

      this.rootStore.notificationStore.SetNotificationMessage({
        message: "Successfully deployed custom contract",
        redirect: true
      });

      return FormatAddress(contractInfo.contractAddress);
    } catch(error) {
      // eslint-disable-next-line no-console
      console.error("Failed to deploy contract");
      // eslint-disable-next-line no-console
      console.error(error);

      this.rootStore.notificationStore.SetErrorMessage({
        message: `Failed to deploy contract: ${error.message || error}`
      });
    }
  });

  @action.bound
  SetCustomContract = flow(function * ({
    libraryId,
    objectId,
    contractName,
    contractDescription,
    address,
    abi,
    factoryAbi,
    bytecode,
    inputs,
    funds
  }) {
    abi = toJS(abi);
    factoryAbi = toJS(factoryAbi);

    if(factoryAbi) {
      try {
        factoryAbi = ParseInputJson(factoryAbi);
      } catch(error) {
        throw `Invalid Factory ABI: ${error.message}`;
      }
    }

    const isContentType = libraryId === Fabric.contentSpaceLibraryId;

    let constructorArgs = [];
    if(inputs.length > 0) {
      constructorArgs = yield Fabric.FormatContractArguments({
        abi,
        methodName: "constructor",
        args: inputs
      });
    }

    // If address is not specified, contract not yet deployed
    if(!address) {
      const contractInfo = yield Fabric.DeployContract({
        abi,
        bytecode,
        constructorArgs
      });

      address = contractInfo.contractAddress;
    }

    // Content types don't have a hook to associate custom contracts
    if(!isContentType) {
      yield Fabric.SetCustomContentContract({
        libraryId,
        objectId,
        name: contractName,
        description: contractDescription,
        customContractAddress: address,
        abi,
        factoryAbi,
        overrides: {gasLimit: 60000000, gasPrice: 1000000},
      });
    } else {
      // Set contract info in metadata for content type
      const editResponse = yield Fabric.EditContentObject({
        libraryId,
        objectId
      });

      yield Fabric.ReplaceMetadata({
        libraryId,
        objectId,
        writeToken: editResponse.write_token,
        metadataSubtree: "custom_contract",
        metadata: {
          name: contractName,
          description: contractDescription,
          address: FormatAddress(address),
          abi,
          factoryAbi
        }
      });

      yield Fabric.FinalizeContentObject({
        libraryId,
        objectId,
        writeToken: editResponse.write_token
      });
    }

    if(funds) {
      yield Fabric.SendFunds({
        recipient: address,
        ether: funds
      });
    }

    this.rootStore.notificationStore.SetNotificationMessage({
      message: "Successfully deployed custom contract",
      redirect: true
    });

    return FormatAddress(address);
  });

  @action.bound
  CallContractMethod = flow(function * ({contractAddress, abi, methodName, methodArgs, value=0}) {
    abi = toJS(abi);

    const method = Object.values(abi).find(entry => entry.type === "function" && entry.name === methodName);

    if(methodArgs.length > 0) {
      methodArgs = yield Fabric.FormatContractArguments({
        abi,
        methodName,
        args: methodArgs
      });
    }

    let methodResults;
    if(method.constant) {
      methodResults = yield Fabric.CallContractMethod({
        contractAddress,
        abi,
        methodName,
        methodArgs,
        value
      });
    } else {
      const transactionInfo = yield Fabric.CallContractMethodAndWait({
        contractAddress,
        abi,
        methodName,
        methodArgs,
        value
      });

      // Try to get result event
      methodResults = yield Fabric.ContractEvents({
        contractAddress,
        abi,
        fromBlock: transactionInfo.blockNumber,
        toBlock: transactionInfo.blockNumber
      });

      // If no event was produced, try and get block info
      if(methodResults.length === 0) {
        methodResults = yield Fabric.GetBlockchainEvents({
          fromBlock: transactionInfo.blockNumber,
          toBlock: transactionInfo.blockNumber
        });
      }

      if(methodResults.length === 0) {
        throw Error("Transaction failed");
      }

      methodResults = methodResults[0];
    }

    return methodResults;
  });

  async GetContractBalance({contractAddress}) {
    return await Fabric.GetBalance({address: contractAddress});
  }

  @action.bound
  SendFunds = flow(function * ({recipient, ether}) {
    yield Fabric.SendFunds({recipient, ether});

    this.rootStore.notificationStore.SetNotificationMessage({
      message: "Successfully sent " + ether + " to " + recipient,
      redirect: true
    });
  });
}

export default ContractStore;
