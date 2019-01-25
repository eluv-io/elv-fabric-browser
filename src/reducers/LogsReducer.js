import ActionTypes from "../actions/ActionTypes";

const SortBlocks = (blocks) => {
  return blocks.sort((a, b) => a.blockNumber < b.blockNumber ? 1 : -1);
};

const LogsReducer = (state = [], action) => {
  switch (action.type) {
    case ActionTypes.logs.clear:
      return [];

    case ActionTypes.logs.list:
      return SortBlocks(state.concat(action.blocks));

    default:
      return state || [];
  }
};

export default LogsReducer;
