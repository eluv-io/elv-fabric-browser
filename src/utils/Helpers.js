// Traverse through a hashmap without throwing errors on undefined keys
// If any keys undefined, returns undefined
export const SafeTraverse = (object, ...keys) => {
  let result = object;

  for(let i = 0; i < keys.length; i++){
    result = result[keys[i]];

    if(result === undefined) { return undefined; }
  }

  return result;
};

export const Wait = async (ms) => {
  await new Promise(resolve => setTimeout(resolve, ms));
};