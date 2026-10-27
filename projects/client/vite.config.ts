import { paraglideVitePlugin } from '@inlang/paraglide-js';
import { sveltekit } from '@sveltejs/kit/vite';
import { svelteTesting } from '@testing-library/svelte/vite';
import { Environment } from '@trakt/api';
import { existsSync, realpathSync } from 'node:fs';
import { join } from 'node:path';
import process from 'node:process';
import { defineConfig, searchForWorkspaceRoot } from 'vite';
import denoSveltekitExit from './.vite/deno-sveltekit-exit.ts';
import pkg from './package.json' with { type: 'json' };
const TRAKT_TARGET_ENVIRONMENT = Environment.production;

function realPathIfExists(path: string) {
  return existsSync(path) ? realpathSync(path) : undefined;
}

export default defineConfig(({ mode }) => ({
  define: {
    'TRAKT_MODE': `"${mode}"`,
    'TRAKT_TARGET_ENVIRONMENT': `"${TRAKT_TARGET_ENVIRONMENT}"`,
    'APP_NAME': `"${pkg.name}"`,
    'APP_VERSION': `"${pkg.version}"`,
  },

  server: {
    proxy: {
      '/api/trakt': {
        target: TRAKT_TARGET_ENVIRONMENT,
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/trakt/, ''),
      },
    },
    host: '0.0.0.0',
    fs: {
      // Worktrees symlink node_modules outside Vite's default workspace root.
      allow: [
        searchForWorkspaceRoot(import.meta.dirname),
        realPathIfExists(join(import.meta.dirname, 'node_modules')),
        realPathIfExists(join(import.meta.dirname, '../../node_modules')),
      ].filter((path) => path !== undefined),
    },
  },

  plugins: [
    sveltekit(),
    paraglideVitePlugin({
      project: './i18n/project.inlang',
      outdir: './src/lib/paraglide',
    }),
    denoSveltekitExit(),
    svelteTesting(),
  ],

  //TODO enable globals when typings are fixed
  test: {
    include: [
      'src/**/*.{test,spec}.{js,ts}',
      '.scripts/**/*.{test,spec}.{js,ts}',
      'i18n/**/*.{test,spec}.{js,ts}',
    ],
    environment: 'jsdom',
    setupFiles: ['./vitest-setup.ts'],
    coverage: {
      provider: 'istanbul',
      reporter: ['clover', 'lcov'],
      exclude: [
        '.svelte-kit/**',
        '.vite/**',
        'test/**',
        'static/**',
        'src/mocks/**',
        'src/lib/paraglide/**',
      ],
    },
    reporters: process.env.GITHUB_ACTIONS ? ['dot', 'github-actions'] : ['dot'],
  },

  resolve: process.env.VITEST
    ? {
      conditions: ['browser'],
    }
    : undefined,
}));
