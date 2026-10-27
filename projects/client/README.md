# trakt

## Developing

Install dependencies with `deno install`, start a development server:

```bash
deno task client:dev
```

## Building

To create a production version of your app:

```bash
deno task build
```

You can preview the production build with
`deno task build && deno task preview`.

> To deploy your app, you may need to install an
> [adapter](https://svelte.dev/docs/kit/adapters) for your target environment.
