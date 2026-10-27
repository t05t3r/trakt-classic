// Map a store's `undefined` to `'unknown'`: a raw `undefined` renders a plain
// item, which remounts as a checkbox item when the state lands.
export type MenuCheckState = boolean | 'unknown';
