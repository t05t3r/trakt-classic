export function setNetwork(state: 'online' | 'offline') {
  globalThis.window.dispatchEvent(new Event(state));
}
