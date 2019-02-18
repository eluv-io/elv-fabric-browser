import ActionTypes from "../actions/ActionTypes";

const SortBlocks = (blocks) => {
  return blocks.sort((a, b) => a[0].blockNumber < b[0].blockNumber ? 1 : -1);
};

const ContractsReducer = (state = {}, action) => {
  let contractState;

  switch (action.type) {
    case ActionTypes.contracts.list:
      return {
        ...state,
        contracts: action.contracts,
        count: {
          ...state.count,
          contracts: action.count
        }
      };

    case ActionTypes.contracts.compile:
      return {
        ...state,
        contractData: action.contractData,
        errors: undefined
      };

    case ActionTypes.contracts.error.compile:
      return {
        ...state,
        contractData: {},
        errors: action.errors
      };

    case ActionTypes.contracts.deployed.list:
      return {
        ...state,
        deployedContracts: action.contracts,
        count: {
          ...state.count,
          deployedContracts: action.count
        }
      };

    case ActionTypes.contracts.deployed.balance:
      contractState = state.deployedContracts[action.contractAddress] || {};
      return {
        ...state,
        deployedContracts: {
          ...state.deployedContracts,
          [action.contractAddress]: {
            ...contractState,
            balance: action.balance
          }
        }
      };

    case ActionTypes.contracts.deployed.events:
      contractState = state.deployedContracts[action.contractAddress] || {};

      return {
        ...state,
        deployedContracts: {
          ...state.deployedContracts,
          [action.contractAddress]: {
            ...contractState,
            events: SortBlocks((contractState.events || []).concat(action.blocks))
          }
        }
      };

    case ActionTypes.contracts.deployed.clearEvents:
      contractState = state.deployedContracts[action.contractAddress] || {};

      return {
        ...state,
        deployedContracts: {
          ...state.deployedContracts,
          [action.contractAddress]: {
            ...contractState,
            events: []
          }
        }
      };

    case ActionTypes.contracts.deployed.call:
      contractState = state.deployedContracts[action.contractAddress] || {};
      return {
        ...state,
        deployedContracts: {
          ...state.deployedContracts,
          [action.contractAddress]: {
            ...contractState,
            methodResults: {
              ...contractState.methodResults,
              [action.methodName]: action.methodResults
            }
          }
        }
      };

    default:
      return {
        ...state,
        count: state.count || {},
        contracts: state.contracts || {},
        deployedContracts: state.deployedContracts || {},
        logs: state.logs || {}
      };
  }
};

export default ContractsReducer;
