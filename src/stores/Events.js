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
  Events = flow(function * ({toBlock, fromBlock, count, clear=false}) {
    if(clear) {
      this.ClearEvents();
    }

    this.events = yield Fabric.GetBlockchainEvents({toBlock, fromBlock, count});

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
