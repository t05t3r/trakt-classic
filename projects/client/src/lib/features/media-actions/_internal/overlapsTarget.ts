type OverlapsTargetParams = {
  targetKeys: ReadonlyArray<string>;
  pendingKey: string;
};

const typeOf = (key: string) => key.split(':').at(0);

// Whether a pending watched write's plays may change the Targets' play count; a key holds no show, so any show-level write counts.
function overlapsKey(targetKey: string, pendingKey: string): boolean {
  if (targetKey === pendingKey) return true;

  const pendingType = typeOf(pendingKey);
  // A Play's key does not name its Target.
  if (pendingType === 'play') return true;

  switch (typeOf(targetKey)) {
    case 'episode':
      return pendingType === 'season' || pendingType === 'show';
    case 'season':
    case 'show':
      return pendingType !== 'movie';
    default:
      return false;
  }
}

export function overlapsTarget(
  { targetKeys, pendingKey }: OverlapsTargetParams,
): boolean {
  return targetKeys.some((targetKey) => overlapsKey(targetKey, pendingKey));
}
