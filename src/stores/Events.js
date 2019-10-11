import Fabric from "../clients/Fabric";
import {action, flow, observable} from "mobx";

class EventsStore {
  @observable events = [];
  @observable contractEvents = {};

  constructor(rootStore) {
    this.rootStore = rootStore;
  }

  SortBlocks(blocks) {
    let uniqueBlocks = {};
    blocks.forEach(block => uniqueBlocks[block[0].blockNumber] = block);

    return Object.values(uniqueBlocks).sort((a, b) => a[0].blockNumber < b[0].blockNumber ? 1 : -1);
  }

  @action.bound
  ContractEvents = flow(function * ({contractAddress, abi, fromBlock=0, toBlock, clear=false}) {
    if(clear) {
      this.ClearContractEvents({contractAddress});
    }

    const newBlocks = yield Fabric.ContractEvents({contractAddress, abi, fromBlock, toBlock});

    this.contractEvents[contractAddress] =
      this.SortBlocks((this.contractEvents[contractAddress] || []).concat(newBlocks));
  });

  @action.bound
  ClearContractEvents({contractAddress}) {
    this.contractEvents[contractAddress] = [];
  }

  @action.bound
  Events = flow(function * ({toBlock, fromBlock, count, clear=false}) {
    if(clear) {
      this.ClearEvents();
    }

    this.events = yield Fabric.GetBlockchainEvents({toBlock, fromBlock, count});
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
