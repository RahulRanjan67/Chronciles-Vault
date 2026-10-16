/**
 * Lightweight request channel from the command palette to routes.
 * The Library owns the create-work modal, so the palette asks for it here.
 * A pending flag covers the case where the Library mounts after the request.
 */

const EVENT_NAME = "cv:create-work-request";
let pendingCreateWork = false;

export function requestCreateWork(): void {
  pendingCreateWork = true;
  window.dispatchEvent(new Event(EVENT_NAME));
}

/** Returns true once per request, then clears it. */
export function consumeCreateWorkRequest(): boolean {
  const value = pendingCreateWork;
  pendingCreateWork = false;
  return value;
}

export function subscribeCreateWorkRequest(callback: () => void): () => void {
  window.addEventListener(EVENT_NAME, callback);
  return () => window.removeEventListener(EVENT_NAME, callback);
}
