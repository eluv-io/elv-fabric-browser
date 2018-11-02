// Properly handle input value updates
export const InputValue = (event) => {
  if(event.target.type === "checkbox") {
    return event.target.checked;
  } else {
    return event.target.value;
  }
};