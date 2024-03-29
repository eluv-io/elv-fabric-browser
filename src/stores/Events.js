import Fabric from "../clients/Fabric";
import {action, flow, observable, runInAction, toJS} from "mobx";
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
    // Reduce to unique addresses
    contractAddresses = [...new Set(contractAddresses)].filter(address => address);

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
    abi = toJS(abi);

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
  Events = flow(function * ({toBlock, fromBlock}) {
    if(fromBlock > toBlock) {
      return;
    }

    const currentBlocks = this.events.map(block => block[0].blockNumber);
    const minBlock = Math.min(...currentBlocks);
    const maxBlock = Math.max(...currentBlocks);

    const newBlocks =
      Math.max(0, Math.min(minBlock, toBlock + 1) - fromBlock)
      + Math.max(0, toBlock - Math.max(maxBlock, fromBlock - 1));

    if(newBlocks > 500) {
      this.rootStore.notificationStore.SetErrorMessage({
        message: "Maximum range is 500 blocks"
      });

      return;
    }

    try {
      for(let highBlock = toBlock; highBlock > fromBlock; highBlock -= 50) {
        const lowBlock = Math.max(fromBlock, highBlock - 50);

        let newBlocks = [];
        if(this.events.length > 0) {
          // Avoid reloading already retrieved blocks

          if((highBlock < minBlock || lowBlock > maxBlock) && highBlock > lowBlock) {
            newBlocks = yield Fabric.GetBlockchainEvents({
              toBlock: highBlock,
              fromBlock: lowBlock,
            });
          } else {
            if(maxBlock < toBlock && highBlock > maxBlock) {
              newBlocks = yield Fabric.GetBlockchainEvents({
                toBlock: highBlock,
                fromBlock: maxBlock + 1,
              });
            }

            if(minBlock - 1 > fromBlock && minBlock > lowBlock) {
              newBlocks = newBlocks.concat(
                yield Fabric.GetBlockchainEvents({
                  toBlock: minBlock,
                  fromBlock: lowBlock,
                })
              );
            }
          }
        } else {
          newBlocks = yield Fabric.GetBlockchainEvents({toBlock: highBlock, fromBlock: lowBlock});
        }

        this.events = this.SortBlocks(newBlocks.concat(this.events))
          .filter(block => block[0].blockNumber <= toBlock && block[0].blockNumber >= fromBlock);

        yield this.ContractNames(
          this.events.map(events => FormatAddress(events[0].address))
        );
      }
    } catch(error) {
      this.rootStore.notificationStore.SetErrorMessage({
        message: error.message || error
      });
    }
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
