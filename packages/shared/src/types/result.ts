/**
 * Result<T, E> — explicit error handling without thrown exceptions.
 *
 * Forces callers to acknowledge failure cases at the type level.  Domain
 * operations return Result instead of throwing so that error paths remain
 * visible in function signatures and composable via helpers below.
 */
export type Result<T, E = Error> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly error: E };

// ---------------------------------------------------------------------------
// Constructors
// ---------------------------------------------------------------------------

/** Wrap a success value in a Result. */
export function ok<T>(value: T): Result<T, never> {
  return { ok: true, value };
}

/** Wrap a failure value in a Result. */
export function err<E>(error: E): Result<never, E> {
  return { ok: false, error };
}

// ---------------------------------------------------------------------------
// Combinators
// ---------------------------------------------------------------------------

/**
 * Transform the success value of a Result, leaving the error untouched.
 *
 * @example
 *   const upper = mapResult(result, s => s.toUpperCase())
 */
export function mapResult<T, U, E>(
  result: Result<T, E>,
  fn: (value: T) => U,
): Result<U, E> {
  if (result.ok) return ok(fn(result.value));
  return result;
}

/**
 * Chain a Result-returning function over the success branch (flatMap / bind).
 *
 * @example
 *   const chained = flatMapResult(result, v => validate(v))
 */
export function flatMapResult<T, U, E>(
  result: Result<T, E>,
  fn: (value: T) => Result<U, E>,
): Result<U, E> {
  if (result.ok) return fn(result.value);
  return result;
}

/**
 * Unwrap the success value or throw the wrapped error.
 * Useful at integration boundaries where exceptions are acceptable.
 */
export function unwrapResult<T, E>(result: Result<T, E>): T {
  if (result.ok) return result.value;
  throw result.error;
}
