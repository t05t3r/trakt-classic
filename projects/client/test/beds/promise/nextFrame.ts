// Resolves once the browser has run the next animation frame's callbacks.
export function nextFrame(): Promise<void> {
  return new Promise((resolve) => requestAnimationFrame(() => resolve()));
}
