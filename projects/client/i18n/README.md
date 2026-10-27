# i18n Meta Messages

Define messages once, generate the Inlang/Paraglide messages for the web app.

## Quick Start

Commands run from `projects/client/`.

```bash
# Generate the web platform
deno task i18n:generate

# Generate explicitly
deno run --allow-read --allow-write i18n/generator/cli.ts -i i18n/meta/ -o i18n/ --platforms web
```

## Message Format

```json
{
  "meta": {
    "locale": "en",
    "direction": "ltr",
    "generator": {
      "inlang": {
        "enabled": true,
        "outputPath": "./messages/{locale}.json"
      }
    }
  },
  "messages": {
    "hello": { "default": "Hello World" },
    "greeting": {
      "default": "Hello, {name}!",
      "variables": {
        "name": { "type": "string" }
      }
    },
    "user_count": {
      "default": "You have {count} messages",
      "variables": {
        "count": { "type": "number" }
      }
    }
  }
}
```

## Commands

```bash
deno task i18n:generate         # Generate the web platform
deno task test:unit i18n/       # Run tests
```
