type PressHold = {
  press: (
    control: HTMLElement | undefined,
    action: () => Promise<unknown>,
  ) => void;
  take: (keep?: HTMLElement) => HTMLElement | undefined;
};

// Holds a pressed control across its action, since a menu or a confirm takes the focus first.
export function createPressHold(): PressHold {
  let held: HTMLElement | undefined;

  const press: PressHold['press'] = (control, action) => {
    held = control;
    void action().finally(() => {
      if (held === control) held = undefined;
    });
  };

  // Hands over the held control and lets it go, unless it is the one to keep.
  const take: PressHold['take'] = (keep) => {
    if (held === keep) return undefined;
    const control = held;
    held = undefined;

    return control;
  };

  return { press, take };
}
