import { RefreshResponseSchema } from '$lib/features/auth/models/RefreshResponseSchema.ts';
import { sessionPersistence } from '$lib/features/auth/sessionPersistence.ts';
import { json, type RequestHandler } from '@sveltejs/kit';
import { z } from 'zod';

const RejectedTokenSchema = z.object({ rejected: z.string().min(1) });

export const POST: RequestHandler = async (event) => {
  const session = event.locals.auth;
  if (!session) return json({ error: 'expired' }, { status: 401 });
  const body = RejectedTokenSchema.safeParse(
    await event.request.json().catch(() => null),
  );
  if (!body.success) {
    return json({ error: 'invalid_request' }, { status: 400 });
  }
  if (body.data.rejected !== session.access) {
    return json({ token: session.access });
  }

  const result = await sessionPersistence.rotate(event, session);
  if (result.kind === 'invalid-grant') {
    return json({ error: 'expired' }, { status: 401 });
  }
  if (result.kind === 'unavailable') {
    return json({ error: 'unavailable' }, { status: 503 });
  }
  return json(RefreshResponseSchema.parse({ token: result.session.access }));
};
