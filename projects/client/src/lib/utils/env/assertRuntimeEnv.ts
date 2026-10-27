type AssertRuntimeEnvParams<N extends string> = {
  env: Record<string, string | undefined>;
  required: ReadonlyArray<N>;
};

export function assertRuntimeEnv<const N extends string>(
  { env, required }: AssertRuntimeEnvParams<N>,
): Readonly<Record<N, string>> {
  const missing = required.filter((name) => !env[name]?.trim());

  if (missing.length > 0) {
    throw new Error(`Missing runtime env: ${missing.join(', ')}`);
  }

  return Object.fromEntries(
    required.map((name) => [name, env[name]]),
  ) as Readonly<Record<N, string>>;
}
