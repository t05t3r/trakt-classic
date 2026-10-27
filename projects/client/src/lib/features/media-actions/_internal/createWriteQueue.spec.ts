import { WriteError } from '$lib/features/media-actions/WriteError.ts';
import { Subject } from 'rxjs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createWriteQueue, type WriteTask } from './createWriteQueue.ts';
import { MAX_RETRY_AFTER_SECONDS } from './MAX_RETRY_AFTER_SECONDS.ts';
import { WRITE_ATTEMPT_TIMEOUT_MS } from './WRITE_ATTEMPT_TIMEOUT_MS.ts';

type Answer = { status: number; headers?: Record<string, string> };
type OnResponse = (response: Response) => void;

function respondWith(answer: Answer | undefined) {
  return (onResponse: OnResponse) => {
    onResponse(new Response(null, answer));
    return Promise.resolve();
  };
}

function throwingAfter(answer: Answer) {
  return (onResponse: OnResponse) => {
    onResponse(new Response(null, answer));
    return Promise.reject(new SyntaxError('unreadable body'));
  };
}

function answering(...answers: ReadonlyArray<Answer>) {
  const calls = { count: 0 };
  const task: WriteTask = ({ onResponse }) => {
    const answer = answers.at(calls.count) ?? answers.at(-1);
    calls.count += 1;
    return respondWith(answer)(onResponse);
  };

  return { task, calls };
}

function deferred() {
  const handle: { resolve: () => void } = {
    resolve: () => undefined,
  };
  const promise = new Promise<void>((resolve) => {
    handle.resolve = resolve;
  });

  return { promise, resolve: () => handle.resolve() };
}

function hanging(): Promise<void> {
  return new Promise(() => undefined);
}

const flush = () => vi.advanceTimersByTimeAsync(0);

describe('createWriteQueue', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  function setup() {
    const sessionExpired$ = new Subject<void>();
    return { queue: createWriteQueue({ sessionExpired$ }), sessionExpired$ };
  }

  it('should run tasks strictly one after another', async () => {
    const { queue } = setup();
    const first = deferred();
    const started: string[] = [];

    const firstDone = queue.enqueue(() => {
      started.push('first');
      return first.promise;
    });
    const secondDone = queue.enqueue(() => {
      started.push('second');
      return Promise.resolve();
    });
    await flush();

    expect(started).toEqual(['first']);

    first.resolve();
    await firstDone;
    await secondDone;

    expect(started).toEqual(['first', 'second']);
  });

  it('should resolve a task that records no response and resolves', async () => {
    const { queue } = setup();

    await expect(queue.enqueue(() => Promise.resolve())).resolves
      .toBeUndefined();
  });

  it.each([200, 201, 204])(
    'should resolve a task that records a %i',
    async (status) => {
      const { queue } = setup();

      await expect(queue.enqueue(({ onResponse }) => {
        onResponse(new Response(null, { status }));
        return Promise.resolve();
      })).resolves.toBeUndefined();
    },
  );

  describe('failures', () => {
    it.each([
      { name: '420', answer: { status: 420 }, errorClass: 'limit-reached' },
      { name: '500', answer: { status: 500 }, errorClass: 'failed' },
      { name: '503', answer: { status: 503 }, errorClass: 'failed' },
      { name: '404', answer: { status: 404 }, errorClass: 'failed' },
      { name: '401 while open', answer: { status: 401 }, errorClass: 'failed' },
    ])(
      'should reject a task answering $name with class $errorClass',
      async ({ answer, errorClass }) => {
        const { queue } = setup();

        const error = await queue.enqueue(answering(answer).task).catch((
          error,
        ) => error);

        expect(error).toBeInstanceOf(WriteError);
        expect(error).toMatchObject({ class: errorClass });
      },
    );

    it('should reject a task that records a 500 and resolves with class failed', async () => {
      const { queue } = setup();

      await expect(queue.enqueue(({ onResponse }) => {
        onResponse(new Response(null, { status: 500 }));
        return Promise.resolve();
      })).rejects.toMatchObject({ class: 'failed' });
    });

    it('should reject a task that records no response and rejects with class failed', async () => {
      const { queue } = setup();

      await expect(
        queue.enqueue(() => Promise.reject(new TypeError('network'))),
      ).rejects.toMatchObject({ class: 'failed' });
    });

    it('should reject a task that throws synchronously with class failed', async () => {
      const { queue } = setup();

      const error = await queue.enqueue(() => {
        throw new TypeError('network');
      }).catch((error) => error);

      expect(error).toBeInstanceOf(WriteError);
      expect(error).toMatchObject({ class: 'failed' });
    });

    it('should run the next task after one fails', async () => {
      const { queue } = setup();
      const next = answering({ status: 201 });

      const failed = queue.enqueue(answering({ status: 500 }).task);
      const done = queue.enqueue(next.task);

      await expect(failed).rejects.toBeInstanceOf(WriteError);
      await expect(done).resolves.toBeUndefined();
    });

    it.each([
      { status: 420, errorClass: 'limit-reached' },
      { status: 500, errorClass: 'failed' },
      { status: 401, errorClass: 'failed' },
    ])(
      'should reject a throw after a $status with class $errorClass',
      async ({ status, errorClass }) => {
        const { queue } = setup();

        await expect(
          queue.enqueue(({ onResponse }) =>
            throwingAfter({ status })(onResponse)
          ),
        ).rejects.toMatchObject({ class: errorClass });
      },
    );

    it('should resolve a throw after a 201', async () => {
      const { queue } = setup();

      await expect(
        queue.enqueue(({ onResponse }) =>
          throwingAfter({ status: 201 })(onResponse)
        ),
      ).resolves.toBeUndefined();
    });
  });

  describe('rate limit', () => {
    it.each<{ name: string; headers: Record<string, string>; wait: number }>([
      { name: 'its Retry-After', headers: { 'Retry-After': '5' }, wait: 5000 },
      { name: '2 s without Retry-After', headers: {}, wait: 2000 },
      {
        name: '2 s when Retry-After is not a number',
        headers: { 'Retry-After': 'Wed, 30 Sep 2026 10:00:00 GMT' },
        wait: 2000,
      },
    ])(
      'should retry a 429 once after $name',
      async ({ headers, wait }) => {
        const { queue } = setup();
        const { task, calls } = answering(
          { status: 429, headers },
          { status: 201 },
        );

        const done = queue.enqueue(task).catch((error) => error);
        await vi.advanceTimersByTimeAsync(wait - 1);

        expect(calls.count).toBe(1);

        await vi.advanceTimersByTimeAsync(1);

        expect(calls.count).toBe(2);
        expect(await done).toBeUndefined();
      },
    );

    it('should retry a 429 once after a Retry-After at the cap', async () => {
      const { queue } = setup();
      const { task, calls } = answering(
        {
          status: 429,
          headers: { 'Retry-After': `${MAX_RETRY_AFTER_SECONDS}` },
        },
        { status: 201 },
      );

      const done = queue.enqueue(task).catch((error) => error);
      await vi.advanceTimersByTimeAsync(MAX_RETRY_AFTER_SECONDS * 1000 - 1);

      expect(calls.count).toBe(1);

      await vi.advanceTimersByTimeAsync(1);

      expect(calls.count).toBe(2);
      expect(await done).toBeUndefined();
    });

    it.each([
      {
        name: 'one second above the cap',
        seconds: MAX_RETRY_AFTER_SECONDS + 1,
      },
      { name: 'far above the timer limit', seconds: 3_000_000 },
    ])(
      'should reject a 429 with a Retry-After $name at once as rate-limited',
      async ({ seconds }) => {
        const { queue } = setup();
        const { task, calls } = answering(
          { status: 429, headers: { 'Retry-After': `${seconds}` } },
          { status: 201 },
        );

        const done = queue.enqueue(task).catch((error) => error);
        await flush();

        expect(await done).toMatchObject({
          class: 'rate-limited',
          retryAfter: seconds,
        });

        await vi.advanceTimersByTimeAsync(seconds * 1000);

        expect(calls.count).toBe(1);
      },
    );

    it('should reject a second 429 as rate-limited with its Retry-After', async () => {
      const { queue } = setup();
      const { task, calls } = answering(
        { status: 429, headers: { 'Retry-After': '1' } },
        { status: 429, headers: { 'Retry-After': '7' } },
      );

      const done = queue.enqueue(task).catch((error) => error);
      await vi.advanceTimersByTimeAsync(10_000);

      expect(calls.count).toBe(2);
      expect(await done).toMatchObject({
        class: 'rate-limited',
        retryAfter: 7,
      });
    });

    it('should leave retryAfter unset when the second 429 has none', async () => {
      const { queue } = setup();
      const { task } = answering({ status: 429 });

      const done = queue.enqueue(task).catch((error) => error);
      await vi.advanceTimersByTimeAsync(2000);

      expect(await done).toMatchObject({ class: 'rate-limited' });
      expect((await done).retryAfter).toBeUndefined();
    });

    it('should retry a 429 that the task threw after', async () => {
      const { queue } = setup();
      const calls = { count: 0 };

      const done = queue.enqueue(({ onResponse }) => {
        calls.count += 1;
        return calls.count === 1
          ? throwingAfter({ status: 429 })(onResponse)
          : respondWith({ status: 201 })(onResponse);
      }).catch((error) => error);
      await vi.advanceTimersByTimeAsync(2000);

      expect(calls.count).toBe(2);
      expect(await done).toBeUndefined();
    });

    it('should reject a second 429 that the task threw after as rate-limited', async () => {
      const { queue } = setup();
      const task = throwingAfter({
        status: 429,
        headers: { 'Retry-After': '3' },
      });

      const done = queue.enqueue(({ onResponse }) => task(onResponse)).catch(
        (error) => error,
      );
      await vi.advanceTimersByTimeAsync(3000);

      expect(await done).toMatchObject({
        class: 'rate-limited',
        retryAfter: 3,
      });
    });

    it('should hold the next task until the retry settles', async () => {
      const { queue } = setup();
      const next = answering({ status: 201 });

      const first = queue.enqueue(
        answering({ status: 429 }, { status: 201 }).task,
      ).catch((error) => error);
      const second = queue.enqueue(next.task).catch((error) => error);
      await vi.advanceTimersByTimeAsync(1999);

      expect(next.calls.count).toBe(0);

      await vi.advanceTimersByTimeAsync(1);

      expect(next.calls.count).toBe(1);
      expect(await first).toBeUndefined();
      expect(await second).toBeUndefined();
    });
  });

  describe('timeout', () => {
    it('should reject a hung task as failed and run the next task', async () => {
      const { queue } = setup();
      const next = answering({ status: 201 });

      const hung = queue.enqueue(hanging).catch((error) => error);
      const done = queue.enqueue(next.task);
      await vi.advanceTimersByTimeAsync(WRITE_ATTEMPT_TIMEOUT_MS - 1);

      expect(next.calls.count).toBe(0);

      await vi.advanceTimersByTimeAsync(1);

      expect(await hung).toMatchObject({ class: 'failed' });
      await expect(done).resolves.toBeUndefined();
      expect(next.calls.count).toBe(1);
    });

    it('should abort the signal of a timed-out attempt', async () => {
      const { queue } = setup();
      const seen: { signal?: AbortSignal } = {};

      const done = queue.enqueue(({ signal }) => {
        seen.signal = signal;
        return hanging();
      }).catch((error) => error);
      await vi.advanceTimersByTimeAsync(WRITE_ATTEMPT_TIMEOUT_MS - 1);

      expect(seen.signal?.aborted).toBe(false);

      await vi.advanceTimersByTimeAsync(1);

      expect(seen.signal?.aborted).toBe(true);
      await done;
    });

    it('should resolve a timeout after a recorded 201', async () => {
      const { queue } = setup();

      const done = queue.enqueue(({ onResponse }) => {
        onResponse(new Response(null, { status: 201 }));
        return hanging();
      }).catch((error) => error);
      await vi.advanceTimersByTimeAsync(WRITE_ATTEMPT_TIMEOUT_MS);

      expect(await done).toBeUndefined();
    });

    it('should retry a timeout after a recorded 429 and settle by the retry', async () => {
      const { queue } = setup();
      const retryAfterSeconds = 5;
      const wait = retryAfterSeconds * 1000;
      const calls = { count: 0 };

      const done = queue.enqueue(({ onResponse }) => {
        calls.count += 1;
        if (calls.count > 1) return respondWith({ status: 201 })(onResponse);

        onResponse(
          new Response(null, {
            status: 429,
            headers: { 'Retry-After': `${retryAfterSeconds}` },
          }),
        );
        return hanging();
      }).catch((error) => error);
      await vi.advanceTimersByTimeAsync(WRITE_ATTEMPT_TIMEOUT_MS + wait - 1);

      expect(calls.count).toBe(1);

      await vi.advanceTimersByTimeAsync(1);

      expect(calls.count).toBe(2);
      expect(await done).toBeUndefined();
    });

    it('should reject a timeout after a recorded 503 as failed and run the next task', async () => {
      const { queue } = setup();
      const next = answering({ status: 201 });

      const hung = queue.enqueue(({ onResponse }) => {
        onResponse(new Response(null, { status: 503 }));
        return hanging();
      }).catch((error) => error);
      const done = queue.enqueue(next.task);
      await vi.advanceTimersByTimeAsync(WRITE_ATTEMPT_TIMEOUT_MS - 1);

      expect(next.calls.count).toBe(0);

      await vi.advanceTimersByTimeAsync(1);

      expect(await hung).toMatchObject({ class: 'failed' });
      await expect(done).resolves.toBeUndefined();
      expect(next.calls.count).toBe(1);
    });

    it('should not abort a task that settles in time', async () => {
      const { queue } = setup();
      const seen: { signal?: AbortSignal } = {};

      await queue.enqueue(({ signal }) => {
        seen.signal = signal;
        return Promise.resolve();
      });
      await vi.advanceTimersByTimeAsync(WRITE_ATTEMPT_TIMEOUT_MS);

      expect(seen.signal?.aborted).toBe(false);
    });

    it('should time each attempt apart from the 429 wait', async () => {
      const { queue } = setup();
      const nearlyTimedOut = WRITE_ATTEMPT_TIMEOUT_MS - 1000;
      const calls = { count: 0 };
      const answerAfter = (answer: Answer, onResponse: OnResponse) =>
        new Promise<void>((resolve) => {
          setTimeout(
            () => resolve(respondWith(answer)(onResponse)),
            nearlyTimedOut,
          );
        });

      const done = queue.enqueue(({ onResponse }) => {
        calls.count += 1;
        return calls.count === 1
          ? answerAfter(
            { status: 429, headers: { 'Retry-After': '10' } },
            onResponse,
          )
          : answerAfter({ status: 201 }, onResponse);
      }).catch((error) => error);
      await vi.advanceTimersByTimeAsync(nearlyTimedOut * 2 + 10_000);

      expect(calls.count).toBe(2);
      expect(await done).toBeUndefined();
    });

    it('should reject a hung task timing out after the Session expires as session-expired', async () => {
      const { queue, sessionExpired$ } = setup();

      const done = queue.enqueue(hanging).catch((error) => error);
      await flush();
      sessionExpired$.next();
      await vi.advanceTimersByTimeAsync(WRITE_ATTEMPT_TIMEOUT_MS);

      expect(await done).toMatchObject({ class: 'session-expired' });
    });
  });

  describe('expired Session', () => {
    it('should reject pending tasks at once without running them', async () => {
      const { queue, sessionExpired$ } = setup();
      const inFlight = deferred();
      const pending = answering({ status: 201 });

      const first = queue.enqueue(() => inFlight.promise);
      const second = queue.enqueue(pending.task).catch((error) => error);
      await flush();
      sessionExpired$.next();

      expect(await second).toMatchObject({ class: 'session-expired' });

      inFlight.resolve();
      await first;

      expect(pending.calls.count).toBe(0);
    });

    it('should reject a task enqueued later without running it', async () => {
      const { queue, sessionExpired$ } = setup();
      const later = answering({ status: 201 });
      sessionExpired$.next();

      await expect(queue.enqueue(later.task)).rejects.toMatchObject({
        class: 'session-expired',
      });
      expect(later.calls.count).toBe(0);
    });

    it("should reject the in-flight task's final 401 as session-expired", async () => {
      const { queue, sessionExpired$ } = setup();

      await expect(queue.enqueue(({ onResponse }) => {
        sessionExpired$.next();
        onResponse(new Response(null, { status: 401 }));
        return Promise.resolve();
      })).rejects.toMatchObject({ class: 'session-expired' });
    });

    it.each<
      { name: string; outcome: (onResponse: OnResponse) => Promise<void> }
    >([
      { name: 'a 503', outcome: respondWith({ status: 503 }) },
      { name: 'a 420', outcome: respondWith({ status: 420 }) },
      {
        name: 'a 429',
        outcome: respondWith({ status: 429, headers: { 'Retry-After': '1' } }),
      },
      {
        name: 'a throw',
        outcome: () => Promise.reject(new TypeError('network')),
      },
    ])(
      'should reject an in-flight task failing with $name after the Session expires as session-expired',
      async ({ outcome }) => {
        const { queue, sessionExpired$ } = setup();

        const done = queue.enqueue(({ onResponse }) => {
          sessionExpired$.next();
          return outcome(onResponse);
        }).catch((error) => error);
        await vi.advanceTimersByTimeAsync(10_000);

        expect(await done).toMatchObject({ class: 'session-expired' });
      },
    );

    it('should resolve an in-flight task succeeding after the Session expires', async () => {
      const { queue, sessionExpired$ } = setup();

      await expect(queue.enqueue(({ onResponse }) => {
        sessionExpired$.next();
        return respondWith({ status: 201 })(onResponse);
      })).resolves.toBeUndefined();
    });

    it('should resolve an in-flight task throwing after a 201 once the Session expires', async () => {
      const { queue, sessionExpired$ } = setup();

      await expect(queue.enqueue(({ onResponse }) => {
        sessionExpired$.next();
        return throwingAfter({ status: 201 })(onResponse);
      })).resolves.toBeUndefined();
    });

    it('should reject a task in its 429 wait without a retry', async () => {
      const { queue, sessionExpired$ } = setup();
      const { task, calls } = answering(
        {
          status: 429,
          headers: { 'Retry-After': `${MAX_RETRY_AFTER_SECONDS}` },
        },
        { status: 201 },
      );

      const done = queue.enqueue(task).catch((error) => error);
      await flush();
      sessionExpired$.next();

      expect(await done).toMatchObject({ class: 'session-expired' });

      await vi.advanceTimersByTimeAsync(MAX_RETRY_AFTER_SECONDS * 1000);

      expect(calls.count).toBe(1);
    });
  });

  it('should stop listening for an expired Session once disposed', () => {
    const { queue, sessionExpired$ } = setup();

    queue.dispose();

    expect(sessionExpired$.observed).toBe(false);
  });
});
