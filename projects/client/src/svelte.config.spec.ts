import config from '../svelte.config.js';
import { afterEach, describe, expect, it, vi } from 'vitest';

// Kit's Csp keywords (BaseSource, ActionSource) that directives take unquoted.
const CSP_BARE_KEYWORDS = new Set([
  'self',
  'none',
  'unsafe-inline',
  'unsafe-eval',
  'unsafe-hashes',
  'unsafe-allow-redirects',
  'unsafe-webtransport-hashes',
  'wasm-unsafe-eval',
  'trusted-types-eval',
  'strict-dynamic',
  'report-sample',
]);

const CSP_LOCAL_SOURCES_BY_DIRECTIVE: ReadonlyMap<
  string,
  ReadonlySet<string>
> = new Map([['worker-src', new Set(['blob:'])]]);

function isString(value: unknown): value is string {
  return typeof value === 'string';
}

function toThirdPartySources([directive, sources]: [string, unknown]) {
  const localSources = CSP_LOCAL_SOURCES_BY_DIRECTIVE.get(directive) ??
    new Set();

  return [sources]
    .flat()
    .filter(isString)
    .filter((source) => !CSP_BARE_KEYWORDS.has(source))
    .filter((source) => !localSources.has(source));
}

async function loadDirectives(nodeEnv: string | undefined) {
  vi.stubEnv('NODE_ENV', nodeEnv);
  vi.resetModules();
  const { default: loaded } = await import('../svelte.config.js');

  return loaded.kit?.csp?.directives ?? {};
}

describe('config: svelte.config.js kit.csp', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('should not allow inline or eval scripts', () => {
    const scriptSrc = config.kit?.csp?.directives?.['script-src'] ?? [];

    expect(scriptSrc).not.toContain('unsafe-inline');
    expect(scriptSrc).not.toContain('unsafe-eval');
  });

  it('should block plugin content and framing entirely', () => {
    expect(config.kit?.csp?.directives?.['object-src']).toEqual(['none']);
    expect(config.kit?.csp?.directives?.['frame-ancestors']).toEqual(['none']);
  });

  it.each(['production', 'development'])(
    'should only reach third parties over https under NODE_ENV=%s',
    async (nodeEnv) => {
      const directives = await loadDirectives(nodeEnv);
      const thirdPartySources = Object.entries(directives).flatMap(
        toThirdPartySources,
      );

      thirdPartySources.forEach((source) => {
        expect(source).toMatch(/^https:\/\/[^*]/);
      });
    },
  );

  it.each(['production', 'test', undefined])(
    'should not set worker-src under NODE_ENV=%s',
    async (nodeEnv) => {
      const directives = await loadDirectives(nodeEnv);

      expect(directives).not.toHaveProperty('worker-src');
    },
  );

  it('should add blob: workers to the production policy in development', async () => {
    const production = await loadDirectives('production');
    const development = await loadDirectives('development');

    expect(development).toEqual({
      ...production,
      'worker-src': ['self', 'blob:'],
    });
  });
});
