export const Cancelable = async (cancelable, f) => {
  if(cancelable) {
    return await cancelable.promise(() => f());
  } else {
    return await f();
  }
};
