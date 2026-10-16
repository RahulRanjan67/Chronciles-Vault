/**
 * Brand utility type.
 *
 * Attaches a phantom type tag to a primitive, creating a nominal type that is
 * incompatible with its raw base type at compile time while remaining identical
 * at runtime.  Use it to distinguish opaque identifiers (e.g. WorkId vs string)
 * without any runtime overhead.
 *
 * @example
 *   type WorkId = Brand<string, 'WorkId'>
 *   const id: WorkId = 'abc' as WorkId  // explicit cast required
 */
export type Brand<Base, Tag extends string> = Base & { readonly __brand: Tag };
