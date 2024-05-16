import type { IsDefinable, IsNever } from "./type_checks";
// get keys of both types that have types that are strictly equal
export type MatchingKeys<A, B> = {
  [I in Extract<keyof A, keyof B>]: A[I] extends B[I]
    ? B[I] extends A[I]
      ? I
      : never
    : never;
}[Extract<keyof A, keyof B>];

export type MatchingInnerKeys<Type, Keys extends keyof Type> = {
  [K in Keys]: MatchingKeys<Type[K], Type[Keys]>;
}[Keys];

export type KeysWith<T, Type> = {
  [K in keyof T]: T[K] extends Type ? K : never;
}[keyof T];

export type IfNoNeverValues<T, Fallback = never> = 1 extends {
  [K in keyof T]: IsNever<T[K], 1, 0>;
}[keyof T]
  ? Fallback
  : T;

export type PropertyType<T, K extends PropertyKey> = K extends keyof T
  ? T[K]
  : never;

/* eslint-disable @typescript-eslint/no-explicit-any */
// some common function type definitions to define here so we don't need to worry about the `any` aspect each time we use the pattern
export type AnyFunction = (...args: any) => any;
export type FnReturns<Returns> = (...args: any) => Returns;

export type TypeGuard<T> = (value: any) => value is T;

/* eslint-enable @typescript-eslint/no-explicit-any */

// gives the return type if a function, otherwise callback
export type ReturnsIfFn<T, Fallback = never> =
  T extends FnReturns<infer R> ? R : Fallback;

// Type for accepting a type or a function that returns that type
export type MaybeFromFn<T> = T | FnReturns<T>;

// The reverse of above, gives the return type or returns the original
export type MaybeReturnType<T> = ReturnsIfFn<T, T>;

// Util to at least help remember that this Record results in {} for intersections
export type BlankObject = Record<never, never>;

type _AddDefinable<Current extends unknown[], ToAdd> = IsDefinable<
  ToAdd,
  [...Current, ToAdd],
  Current
>;

type _PushDefinable<
  Input,
  Output extends unknown[] = [],
> = Input extends unknown[]
  ? Input extends [infer Next, ...rest: infer Rest]
    ? _PushDefinable<Rest, _AddDefinable<Output, Next>>
    : Output
  : _PushDefinable<[Input], Output>;

export type FilterDefinable<Input> = _PushDefinable<Input, []>;
