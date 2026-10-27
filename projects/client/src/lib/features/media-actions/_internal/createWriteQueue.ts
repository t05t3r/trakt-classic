import { WriteError } from '$lib/features/media-actions/WriteError.ts';
import type { Observable } from 'rxjs';
import { MAX_RETRY_AFTER_SECONDS } from './MAX_RETRY_AFTER_SECONDS.ts';
import { WRITE_ATTEMPT_TIMEOUT_MS } from './WRITE_ATTEMPT_TIMEOUT_MS.ts';

export type WriteTask = (
  params: { onResponse: (response: Response) => void; signal: AbortSignal },
) => Promise<void>;

export type WriteQueue = {
  enqueue: (task: WriteTask) => Promise<void>;
  dispose: () => void;
};

export type CreateWriteQueueParams = { sessionExpired$: Observable<void> };

type Attempt =
  | { ok: true }
  | { ok: false; status?: number; retryAfter?: number };

const LIMIT_REACHED = 420;
const RATE_LIMITED = 429;
const DEFAULT_RETRY_AFTER_SECONDS = 2;

function parseRetryAfter(value: string | null): number | undefined {
  if (value === null || value.trim() === '') return;

  const seconds = Number(value);
  return Number.isFinite(seconds) && seconds >= 0 ? seconds : undefined;
}

type SettleWithinParams = {
  settled: Promise<boolean>;
  controller: AbortController;
  onTimeout: () => boolean;
};

// Resolves on timeout even when the task ignores the abort, to free the slot.
function settleWithin(
  { settled, controller, onTimeout }: SettleWithinParams,
): Promise<boolean> {
  return new Promise((resolve) => {
    const timer = setTimeout(() => {
      controller.abort(new DOMException('The write timed out', 'TimeoutError'));
      resolve(onTimeout());
    }, WRITE_ATTEMPT_TIMEOUT_MS);

    settled.then((succeeded) => {
      clearTimeout(timer);
      resolve(succeeded);
    });
  });
}

async function runAttempt(task: WriteTask): Promise<Attempt> {
  const recorded: { last?: Response } = {};
  const onResponse = (response: Response) => {
    recorded.last = response;
  };
  const controller = new AbortController();

  const settled = Promise.resolve()
    .then(() => task({ onResponse, signal: controller.signal }))
    .then(() => true, () => false);
  const succeeded = await settleWithin({
    settled,
    controller,
    onTimeout: () => false,
  });

  const { last } = recorded;
  if (!last) return succeeded ? { ok: true } : { ok: false };
  // The server accepted the write, so a recorded 2xx succeeds even when the
  // task then throws or times out.
  if (last.ok) return { ok: true };

  return {
    ok: false,
    status: last.status,
    retryAfter: parseRetryAfter(last.headers.get('Retry-After')),
  };
}

function toWriteError(
  attempt: Attempt,
  closed: boolean,
): WriteError | undefined {
  if (attempt.ok) return;
  if (closed) return sessionExpiredError();
  if (attempt.status === RATE_LIMITED) {
    return new WriteError({
      class: 'rate-limited',
      retryAfter: attempt.retryAfter,
    });
  }
  if (attempt.status === LIMIT_REACHED) {
    return new WriteError({ class: 'limit-reached' });
  }

  return new WriteError({ class: 'failed' });
}

function sessionExpiredError(): WriteError {
  return new WriteError({ class: 'session-expired' });
}

export function createWriteQueue(
  { sessionExpired$ }: CreateWriteQueueParams,
): WriteQueue {
  const closeListeners = new Set<() => void>();
  const state = { closed: false, tail: Promise.resolve() };

  const close = () => {
    state.closed = true;
    closeListeners.forEach((listener) => listener());
    closeListeners.clear();
  };

  const waitUnlessClosed = (seconds: number) =>
    new Promise<void>((resolve) => {
      if (state.closed) return resolve();

      const wake = () => {
        clearTimeout(timeout);
        closeListeners.delete(wake);
        resolve();
      };
      const timeout = setTimeout(wake, seconds * 1000);
      closeListeners.add(wake);
    });

  const settle = (attempt: Attempt) => {
    const error = toWriteError(attempt, state.closed);
    if (error) throw error;
  };

  const execute = async (task: WriteTask) => {
    const first = await runAttempt(task);
    if (first.ok || first.status !== RATE_LIMITED) return settle(first);

    const wait = first.retryAfter ?? DEFAULT_RETRY_AFTER_SECONDS;
    if (wait > MAX_RETRY_AFTER_SECONDS) return settle(first);

    await waitUnlessClosed(wait);
    if (state.closed) throw sessionExpiredError();

    return settle(await runAttempt(task));
  };

  const enqueue = (task: WriteTask) => {
    if (state.closed) return Promise.reject(sessionExpiredError());

    return new Promise<void>((resolve, reject) => {
      const cancel = () => reject(sessionExpiredError());
      closeListeners.add(cancel);

      state.tail = state.tail.then(() => {
        // A task cancelled by an expired Session has left the listeners.
        if (!closeListeners.delete(cancel)) return;

        return execute(task).then(resolve, reject);
      });
    });
  };

  const subscription = sessionExpired$.subscribe(close);

  return { enqueue, dispose: () => subscription.unsubscribe() };
}
