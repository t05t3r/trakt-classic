import { NOOP_FN } from '$lib/utils/NOOP_FN.ts';

// Asks `isMatch` on every read, so a spec flips layouts without new lists.
export class FakeMediaQueryList extends EventTarget implements MediaQueryList {
  onchange = null;
  addListener = NOOP_FN;
  removeListener = NOOP_FN;

  constructor(
    readonly media: string,
    private readonly isMatch: (media: string) => boolean,
  ) {
    super();
  }

  get matches() {
    return this.isMatch(this.media);
  }
}
