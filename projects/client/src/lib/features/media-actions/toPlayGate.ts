// `unknown` refuses input like `blocked` but shows no reason, as while a value it needs loads.
export type PlayGate = 'open' | 'unknown' | 'blocked';

type PlayGateParams = {
  // Whether the favourite or the rating is already set.
  isSet: boolean | undefined;
  hasPlay: boolean | undefined;
};

// Only an add needs a Play: what is already set can always be changed or removed.
export function toPlayGate({ isSet, hasPlay }: PlayGateParams): PlayGate {
  if (isSet) return 'open';
  if (isSet === undefined || hasPlay === undefined) return 'unknown';

  return hasPlay ? 'open' : 'blocked';
}
