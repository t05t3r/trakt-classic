// Past the safe integers a digit string rounds to another number, or to `1e+21` in a path.
export function isPositiveIntegerText(value: string): boolean {
  return /^[1-9]\d*$/.test(value) && Number.isSafeInteger(Number(value));
}
