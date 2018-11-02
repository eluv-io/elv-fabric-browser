import ActionTypes from "../actions/ActionTypes";

const ContractsReducer = (state = {}, action) => {
  switch (action.type) {
    case ActionTypes.request.contracts.completed.compile:
      return {
        ...state,
        contractData: action.contractData,
        errors: undefined
      };
    case ActionTypes.request.contracts.error.compile:
      return {
        ...state,
        contractData: {},
        errors: action.errors
      };
    case ActionTypes.request.contracts.completed.deploy:
      return {
        ...state,
        deployedContracts: {
          ...state.deployedContracts,
          [action.contractInfo.address]: action.contractInfo
        }
      };

    default:
      return {
        ...state
      };
  }
};

export default ContractsReducer;
