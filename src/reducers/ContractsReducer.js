import ActionTypes from "../actions/ActionTypes";

const ContractsReducer = (state = {}, action) => {
  let contractState;

  switch (action.type) {
    case ActionTypes.contracts.list:
      return {
        ...state,
        contracts: action.contracts
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

    case ActionTypes.contracts.deploy:
      return {
        ...state,
        deployedContracts: {
          ...state.deployedContracts,
          [action.contractInfo.address]: action.contractInfo
        }
      };

    case ActionTypes.contracts.balance:
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

    case ActionTypes.contracts.events:
      contractState = state.deployedContracts[action.contractAddress] || {};

      return {
        ...state,
        deployedContracts: {
          ...state.deployedContracts,
          [action.contractAddress]: {
            ...contractState,
            events: action.events
          }
        }
      };

    case ActionTypes.contracts.call:
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
        contracts: state.contracts || {},
        deployedContracts: state.deployedContracts || {}
      };
  }
};

export default ContractsReducer;
