import ActionTypes from "../actions/ActionTypes";

const SortBlocks = (blocks) => {
  let uniqueBlocks = {};
  blocks.forEach(block => uniqueBlocks[block[0].blockNumber] = block);

  return Object.values(uniqueBlocks).sort((a, b) => a[0].blockNumber < b[0].blockNumber ? 1 : -1);
};

const LogsReducer = (state = [], action) => {
  switch(action.type) {
    case ActionTypes.logs.clear:
      return [];

    case ActionTypes.logs.list:
      return SortBlocks(state.concat(action.blocks));

    default:
      return state || [];
  }
};

export default LogsReducer;
