export function toUserAgent(origin: string): string {
  return `${APP_NAME}/${APP_VERSION} (+${origin})`;
}
