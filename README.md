# trakt-classic

A third-party web client for [Trakt](https://trakt.tv) that brings back the
classic trakt.tv look. It is built with SvelteKit (Svelte 5) and is derived from
Trakt's open-source web app,
[trakt/trakt-web](https://github.com/trakt/trakt-web).

This project is not affiliated with or endorsed by Trakt. It uses no Trakt
logos, fonts or other licensed assets; icons are
[Tabler Icons](https://tabler.io/icons) (MIT).

## Requirements

- [Deno](https://deno.com) 2.x for development, building and tests.
- Docker, to run the production build.
- A Trakt API app from <https://developer.trakt.tv/apps>. Sign-in uses PKCE, so
  the app needs no secret, only its client id. Set its redirect URI to
  `<ORIGIN>/auth/callback`.

## Configuration

Copy `.env.example` to `.env` and fill it in:

| Variable                  | Required | Purpose                                             |
| ------------------------- | -------- | --------------------------------------------------- |
| `ORIGIN`                  | yes      | Public origin the app is served on, no trailing `/` |
| `PUBLIC_TRAKT_CLIENT_ID`  | yes      | Client id of your Trakt API app                     |
| `IMAGE_CACHE_MAX_BYTES`   | no       | Size cap of the on-disk image cache                 |
| `IMAGE_FETCH_CONCURRENCY` | no       | Parallel image fetches to the image origin          |
| `IMAGE_ORIGIN`            | no       | Origin images are proxied from                      |

The server refuses to start when a required variable is missing.

## Development

```bash
deno task install
cp .env.example projects/client/.env # then fill it in
deno task client:dev
```

Checks and tests:

```bash
deno task gates     # fmt, node_modules, type check, lint, unit tests
deno task test:unit # unit and component tests only
```

## Running with Docker

```bash
cp .env.example .env # then fill it in
docker compose up -d --build
```

The container listens on `127.0.0.1:3000`; put a reverse proxy in front of it
for TLS. Images are cached on disk in the `image-cache` volume.

## Licence

GPL-3.0-or-later; see [LICENSE](LICENSE) and [NOTICE](NOTICE). Portions are
derived from trakt/trakt-web, copyright Trakt Inc.
