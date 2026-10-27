import adapter from '@sveltejs/adapter-node';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import { fileURLToPath } from 'node:url';

import { dirname, join } from 'node:path';
import process from 'node:process';

const __dirname = dirname(fileURLToPath(import.meta.url));

/** @type {import('@sveltejs/kit').Config} */
const config = {
  // Consult https://svelte.dev/docs/kit/integrations
  // for more information about preprocessors
  preprocess: vitePreprocess({
    style: {
      resolve: {
        alias: {
          $style: join(__dirname, 'src/style'),
        },
      },
    },
  }),

  kit: {
    // See https://svelte.dev/docs/kit/adapters for more information about adapters.
    adapter: adapter({ out: 'build', precompress: true }),
    csp: {
      mode: 'auto',
      directives: {
        'default-src': ['self'],
        'script-src': ['self'],
        // inline style attributes, e.g. app.html and LazyImage
        'style-src': ['self', 'unsafe-inline'],
        'connect-src': ['self', 'https://api.trakt.tv'],
        'img-src': ['self', 'https://secure.gravatar.com'],
        'font-src': ['self'],
        'form-action': ['self'],
        'object-src': ['none'],
        'base-uri': ['self'],
        'frame-ancestors': ['none'],
        // Vite's dev client polls for a restarted server from a blob: SharedWorker.
        ...(process.env.NODE_ENV === 'development'
          ? { 'worker-src': ['self', 'blob:'] }
          : {}),
      },
    },
    serviceWorker: {
      register: false,
    },
    paths: {
      relative: false,
    },
    alias: {
      '$mocks': './src/mocks',
      '$test': './test',
      '$style': 'src/style',
      '$static': './static',
      '$types': './.svelte-kit/types/src/routes',
    },
  },
};

export default config;
