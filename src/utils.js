export async function asyncEvent({ element, eventName }) {
  return new Promise((resolve) => element.addEventListener(eventName, resolve));
}

export async function waitMs(ms) {
  if (ms <= 0) {
    return;
  }
  return new Promise((resolve) => setTimeout(resolve, ms));
}
