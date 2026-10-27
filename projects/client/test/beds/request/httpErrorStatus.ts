import { isHttpError } from '@sveltejs/kit';

export async function httpErrorStatus(
  run: () => Promise<unknown>,
): Promise<number | undefined> {
  try {
    await run();
  } catch (error) {
    return isHttpError(error) ? error.status : undefined;
  }
  return undefined;
}
