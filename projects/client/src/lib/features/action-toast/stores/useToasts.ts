import { time } from '$lib/utils/timing/time.ts';
import { BehaviorSubject, type Observable } from 'rxjs';

export type ToastEntry = { readonly id: string; readonly message: string };

const ACTION_TOAST_DURATION = time.seconds(6);
const MAX_TOASTS = 3;

const toasts = new BehaviorSubject<ReadonlyArray<ToastEntry>>([]);
const timers = new Map<string, ReturnType<typeof setTimeout>>();

const clearTimer = (id: string) => {
  clearTimeout(timers.get(id));
  timers.delete(id);
};

const dismiss = (id: string) => {
  if (!timers.has(id)) return;

  clearTimer(id);
  toasts.next(toasts.value.filter((toast) => toast.id !== id));
};

const notify = (message: string) => {
  const id = crypto.randomUUID();
  const next = [{ id, message }, ...toasts.value];

  next.slice(MAX_TOASTS).forEach((evicted) => clearTimer(evicted.id));
  timers.set(id, setTimeout(() => dismiss(id), ACTION_TOAST_DURATION));
  toasts.next(next.slice(0, MAX_TOASTS));
};

export function useToasts(): {
  toasts: Observable<ReadonlyArray<ToastEntry>>;
  notify: (message: string) => void;
  dismiss: (id: string) => void;
} {
  return {
    toasts: toasts.asObservable(),
    notify,
    dismiss,
  };
}
