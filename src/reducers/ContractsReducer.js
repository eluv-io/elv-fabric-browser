import ActionTypes from "../actions/ActionTypes";

const SortBlocks = (blocks) => {
  let uniqueBlocks = {};
  blocks.forEach(block => uniqueBlocks[block[0].blockNumber] = block);

  return Object.values(uniqueBlocks).sort((a, b) => a[0].blockNumber < b[0].blockNumber ? 1 : -1);
};

const ContractsReducer = (state = {}, action) => {
  const newState = {
    ...state,
    count: state.count || {},
    contracts: state.contracts || {},
    deployedContracts: state.deployedContracts || {},
    logs: state.logs || {}
  };

  switch(action.type) {
    case ActionTypes.contracts.list:
      newState.contracts = action.contracts;
      newState.count.contracts = action.count;
      break;

    case ActionTypes.contracts.compile:
      newState.contractData = action.contractData;
      newState.errors = undefined;
      break;

    case ActionTypes.contracts.error.compile:
      newState.contractData = {};
      newState.errors = action.errors;
      break;

    case ActionTypes.contracts.deployed.list:
      newState.deployedContracts = action.contracts;
      newState.count.deployedContracts = action.count;
      break;

    case ActionTypes.contracts.deployed.balance:
      const contractInfo = newState.deployedContracts[action.contractAddress] || {};
      contractInfo.balance = action.balance;

      newState.deployedContracts[action.contractAddress] = contractInfo;
      break;

    case ActionTypes.contracts.deployed.events:
      const events = state.deployedContracts[action.contractAddress].events || [];

      newState.deployedContracts[action.contractAddress].events =
        SortBlocks((events || []).concat(action.blocks));

      break;

    case ActionTypes.contracts.deployed.clearEvents:
      newState.deployedContracts[action.contractAddress].events = [];
      break;

    case ActionTypes.contracts.deployed.call:
      const methodResults = newState.deployedContracts[action.contractAddress].methodResults || {};
      methodResults[action.methodName] = action.methodResults;

      newState.deployedContracts[action.contractAddress].methodResults = methodResults;
      break;
  }

  return newState;
};

export default ContractsReducer;
