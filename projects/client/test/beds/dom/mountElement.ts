import { onTestFinished } from 'vitest';

export function mountElement<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  parent: HTMLElement = document.body,
) {
  const element = document.createElement(tag);
  parent.append(element);
  onTestFinished(() => element.remove());
  return element;
}
