import { onTestFinished, vi } from 'vitest';

function blurInside(node: unknown) {
  const active = document.activeElement;
  if (!(node instanceof Node) || !(active instanceof HTMLElement)) return;
  if (node.contains(active)) active.blur();
}

// Chromium blurs a focused element as it is moved or removed; jsdom drops its
// focus with no event. Svelte moves with `before` and clears with `textContent`.
export function blurOnMoveAndRemoval(): void {
  const childSpies = [CharacterData.prototype, Element.prototype].flatMap(
    (prototype) => {
      const before = prototype.before;
      const remove = prototype.remove;
      return [
        vi.spyOn(prototype, 'before').mockImplementation(
          function (this: ChildNode, ...nodes: (Node | string)[]) {
            nodes.forEach(blurInside);
            before.apply(this, nodes);
          },
        ),
        vi.spyOn(prototype, 'remove').mockImplementation(
          function (this: ChildNode) {
            blurInside(this);
            remove.call(this);
          },
        ),
      ];
    },
  );
  const setText = Object.getOwnPropertyDescriptor(Node.prototype, 'textContent')
    ?.set;
  const textSpy = vi.spyOn(Node.prototype, 'textContent', 'set')
    .mockImplementation(function (this: Node, value: string | null) {
      blurInside(this);
      setText?.call(this, value);
    });
  onTestFinished(() => {
    childSpies.forEach((spy) => spy.mockRestore());
    textSpy.mockRestore();
  });
}
