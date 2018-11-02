// Convert given list of functions to Thunks
const Thunk = (dispatch, funcs) => {
  let thunks = {};

  for(const func of funcs) {
    thunks[func.name] = (ps) => dispatch(func(ps));
  }

  return thunks;
};

export default Thunk;
