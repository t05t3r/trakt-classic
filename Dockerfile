# syntax=docker/dockerfile:1

# ---- build: Deno, exactly as the workstation builds ----
FROM denoland/deno:2.9.7 AS build
WORKDIR /src

# Dependency layer: workspace manifests + lockfile only, so source edits do
# not re-run the install.
COPY deno.json deno.lock .npmrc ./
COPY projects/client/deno.json projects/client/package.json projects/client/
RUN deno install --frozen

COPY . .
WORKDIR /src/projects/client
# No separate i18n step: the build task generates and compiles the messages.
RUN deno task build

# ---- runtime: Node LTS, no node_modules ----
FROM node:24-alpine
ENV NODE_ENV=production \
    PORT=3000 \
    HOST=0.0.0.0 \
    ADDRESS_HEADER=x-forwarded-for \
    XFF_DEPTH=1 \
    IMAGE_CACHE_DIR=/var/cache/trakt/images
WORKDIR /app

# Image Cache root, owned by the runtime user; a named volume mounted here
# inherits this ownership on first use.
RUN mkdir -p "$IMAGE_CACHE_DIR" && chown -R node:node /var/cache/trakt

COPY --from=build /src/projects/client/build ./build
# `"type": "module"` is what adapter-node's ESM entry needs from package.json.
COPY --from=build /src/projects/client/package.json ./package.json

USER node
EXPOSE 3000
CMD ["node", "build"]
