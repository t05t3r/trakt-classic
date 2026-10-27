export function openAt(path: string) {
  window.history.replaceState(null, '', path);
}
