type ParseEnvStringParams = {
  value: string | undefined;
  fallback: string;
};

// An empty/whitespace env value is unset, not a literal empty path.
export function parseEnvString(
  { value, fallback }: ParseEnvStringParams,
): string {
  const trimmed = value?.trim();
  return trimmed ? trimmed : fallback;
}
