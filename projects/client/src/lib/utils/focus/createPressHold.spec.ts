import { createPressHold } from '$lib/utils/focus/createPressHold.ts';
import { describe, expect, it } from 'vitest';

const PENDING = () => new Promise<void>(() => undefined);

describe('util: createPressHold', () => {
  it('should hold the control while its action runs, and hand it over once', () => {
    const hold = createPressHold();
    const control = document.createElement('button');

    hold.press(control, PENDING);

    expect(hold.take()).toBe(control);
    expect(hold.take()).toBeUndefined();
  });

  it('should keep holding a control that is the one to keep', () => {
    const hold = createPressHold();
    const control = document.createElement('button');
    hold.press(control, PENDING);

    expect(hold.take(control)).toBeUndefined();
    expect(hold.take()).toBe(control);
  });

  it('should let go once the action ends', async () => {
    const hold = createPressHold();
    const action = Promise.resolve();
    hold.press(document.createElement('button'), () => action);

    await action;
    await Promise.resolve();

    expect(hold.take()).toBeUndefined();
  });

  it('should keep a later press when an earlier action ends', async () => {
    const hold = createPressHold();
    const later = document.createElement('button');
    const action = Promise.resolve();
    hold.press(document.createElement('button'), () => action);
    hold.press(later, PENDING);

    await action;
    await Promise.resolve();

    expect(hold.take()).toBe(later);
  });
});
