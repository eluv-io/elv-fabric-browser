import Fabric from "../clients/Fabric";
import {action, flow, observable, runInAction} from "mobx";
import {FormatAddress} from "../utils/Helpers";

class EventsStore {
  @observable events = [];
  @observable contractEvents = {};
  @observable contractNames = {};

  constructor(rootStore) {
    this.rootStore = rootStore;
  }

  SortBlocks(blocks) {
    let uniqueBlocks = {};
    blocks.forEach(block => uniqueBlocks[block[0].blockNumber] = block);

    return Object.values(uniqueBlocks).sort((a, b) => a[0].blockNumber < b[0].blockNumber ? 1 : -1);
  }

  @action.bound
  async ContractNames(contractAddresses) {
    await contractAddresses.limitedMap(
      5,
      async contractAddress => {
        if(!this.contractNames[contractAddress]) {
          const contractName = await Fabric.ContractName(contractAddress);

          runInAction(() => this.contractNames[contractAddress] = contractName);
        }
      }
    );
  }

  @action.bound
  ContractEvents = flow(function * ({contractAddress, abi, fromBlock=0, toBlock, clear=false}) {
    if(clear) {
      this.ClearContractEvents({contractAddress});
    }

    const newBlocks = yield Fabric.ContractEvents({contractAddress, abi, fromBlock, toBlock});

    this.contractEvents[contractAddress] =
      this.SortBlocks((this.contractEvents[contractAddress] || []).concat(newBlocks));

    yield this.ContractNames([contractAddress]);
  });

  @action.bound
  ClearContractEvents({contractAddress}) {
    this.contractEvents[contractAddress] = [];
  }

  @action.bound
  Events = flow(function * ({toBlock, fromBlock, count}) {
    let newBlocks = [];
    if(this.events.length > 0) {
      // Avoid reloading already retrieved blocks
      const currentBlocks = this.events.map(block => block[0].blockNumber);
      const minBlock = Math.min(...currentBlocks);
      const maxBlock = Math.max(...currentBlocks);

      if(toBlock < minBlock || fromBlock > maxBlock) {
        newBlocks = yield Fabric.GetBlockchainEvents({toBlock, fromBlock, count});
      } else {
        if(maxBlock < toBlock) {
          newBlocks = yield Fabric.GetBlockchainEvents({toBlock, fromBlock: maxBlock + 1, count});
        }

        if(minBlock - 1 > fromBlock) {
          newBlocks = newBlocks.concat(yield Fabric.GetBlockchainEvents({toBlock: minBlock, fromBlock, count}));
        }
      }
    } else {
      newBlocks = yield Fabric.GetBlockchainEvents({toBlock, fromBlock, count});
    }

    this.events = this.SortBlocks(newBlocks.concat(this.events))
      .filter(block => block[0].blockNumber <= toBlock && block[0].blockNumber >= fromBlock);

    yield this.ContractNames(
      this.events.map(events => FormatAddress(events[0].address))
    );
  });

  @action.bound
  ClearEvents() {
    this.events = [];
  }

  @action.bound
  async BlockNumber() {
    return await Fabric.GetBlockNumber();
  }
}

export default EventsStore;
