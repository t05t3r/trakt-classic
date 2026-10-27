type CreateWarnOnceParams = {
  readonly windowMs: number;
};

export function createWarnOnce(
  { windowMs }: CreateWarnOnceParams,
): (key: string, message: string) => void {
  const lastWarnAt = new Map<string, number>();

  return (key, message) => {
    const now = Date.now();
    const last = lastWarnAt.get(key);
    if (last !== undefined && now - last < windowMs) return;

    lastWarnAt.set(key, now);
    console.warn(message);
  };
}
