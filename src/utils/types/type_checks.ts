import type { PickAlwaysDefined } from "./maps";
// export type nil = null | undefined;

export type IsMaybeUndefined<T, True, False> = [undefined] extends [T]
  ? True
  : False;
export type IfMaybeUndefined<T, Fallback = never> = IsMaybeUndefined<
  T,
  T,
  Fallback
>;

export type IsMaybeVoid<T, True, False> = [void] extends T ? True : False;
export type IsMaybeNull<T, True, False> = [null] extends T ? True : False;

// export type IsMaybeNil<T, True, False> =
//   IsMaybeNull<T, 1, 0> extends 1 ? True : IsMaybeUndefined<T, True, False>;

// taken from https://github.com/joonhocho/tsdef
// return True if T is `never`, otherwise return False
// wrap with array to prevent args distributing
export type IsNever<T, True, False = never> = [T] extends [never]
  ? True
  : False;

export type IfNotNever<T, Fallback = never> = IsNever<T, Fallback, T>;

// taken from https://github.com/joonhocho/tsdef
// return True if T is `any`, otherwise return False
export type IsAny<T, True, False = never> = true | false extends (
  T extends never ? true : false
)
  ? True
  : False;

export type IfNotAny<T, Fallback = never> = IsAny<T, Fallback, T>;

export type IsAnyOrNever<T, True, False = never> = IsAny<
  T,
  True,
  IsNever<T, True, False>
>;

// taken from https://github.com/joonhocho/tsdef
// return True if T is `unknown`, otherwise return False
export type IsUnknown<T, True, False = never> = unknown extends T
  ? IsAny<T, False, True>
  : False;

// canBeDefined: not- void, undefined, null, never
// returns True if the type can be assigned to. Mostly for object values.
// null is debatable, but if the type is only null, can only assign null to it so not exactly assignable
// if the type is a union with an assignable type, will still return true
export type IsDefinable<T, True, False> = IsNever<
  Exclude<T, null | undefined | void>,
  False,
  True
>;

export type IfDefinable<T, Fallback = never> = IsDefinable<T, T, Fallback>;

// checks if the type is definable and doesn't accept undefined.
export type IsAlwaysDefined<T, True, False> =
  IsDefinable<T, 1, 0> extends 1 ? IsMaybeUndefined<T, False, True> : False;
export type IsMostlyDefined<T, True, False> =
  IsDefinable<T, 1, 0> extends 1 ? IsMaybeUndefined<T, True, False> : False;

// return True if Type is an object that is empty {}. Useful when combined with types that remove object keys somehow and we want to check if they have been completely emptied
export type IsEmptyObj<T, True, False> = T extends object
  ? keyof T extends never
    ? True
    : False
  : False;

// Type checks that return type if they pass, otherwise return else

export type IfNotEmptyObj<T, Fallback = never> = IsEmptyObj<T, Fallback, T>;

// test if object provided could accept undefined variable when doing `const var: T = {...input};` or if it's safe to do (input: T = {})
export type IsUndefinedSpreadable<T, True, False> = T extends object
  ? IsEmptyObj<PickAlwaysDefined<T>, True, False>
  : False;

export type IfUndefinedSpreadable<T, Fallback = never> = IsUndefinedSpreadable<
  T,
  T,
  Fallback
>;

export type IsMaybeUndefinedSpreadable<T, True, False> = IsMaybeUndefined<
  T,
  True,
  IsUndefinedSpreadable<T, True, False>
>;

export type IfMaybeUndefinedSpreadable<T, Fallback = never> = IfMaybeUndefined<
  T,
  IfUndefinedSpreadable<T, Fallback>
>;
