export async function asyncEvent({ element, eventName }) {
  return new Promise((resolve) => element.addEventListener(eventName, resolve));
}
