import { BlankObject } from "./misc";
import type {
  IsAny,
  IfNotEmptyObj,
  IsDefinable,
  IsAlwaysDefined,
  IsMostlyDefined,
  IsNever,
  IfNotNever,
  IfNotAny,
} from "./type_checks";
// create a union of types where only one of each in Keys is required, and the rest of the keys are optional
export type RequireAtLeastOne<T, Keys extends keyof T = keyof T> = Omit<
  T,
  Keys
> &
  {
    [K in Keys]: Required<Pick<T, K>> & Partial<Pick<T, Exclude<Keys, K>>>;
  }[Keys];

// Combined my idea with similar type from https://github.com/joonhocho/tsdef and added ability to keep certain types from being dug into.
// make all properties optional recursively including nested objects.
// the comparison for except types might be too simple for some types
export type DeepPartial<Type, ExceptTypes = never> = Type extends ExceptTypes
  ? Type
  : Type extends Array<infer I>
    ? DeepPartial<I, ExceptTypes>
    : // first pull out the keys that are exceptions, and keep them as is
      {
        [K in keyof Type as Type[K] extends ExceptTypes ? K : never]: Type[K];
      } & {
        // now get all the keys that aren't in the ExceptTypes to make optional
        [K in keyof Type as Type[K] extends ExceptTypes
          ? never
          : K]?: DeepPartial<Type[K], ExceptTypes>;
      };

// only make some keys partial
export type PartPartial<T, K extends keyof T> = Omit<T, K> &
  Partial<Pick<T, K>>;
// make partial except for specified keys
export type PartialExcept<T, K extends keyof T> = Partial<Omit<T, K>> &
  Pick<T, K>;

// pick but can use any keys not just keyof Type
export type PickMaybe<Type, Keys extends PropertyKey> = Pick<
  Type,
  Extract<keyof Type, Keys>
>;
export type StrictPickMaybe<
  Type,
  Keys extends PropertyKey,
  Fallback = never,
> = IfNotEmptyObj<PickMaybe<Type, Keys>, Fallback>;

export type OmitNever<Type> = {
  [K in keyof Type as IsNever<Type[K], never, K>]: Type[K];
};

// pick from object only the values that can be defined, removing never, void, etc.
export type PickDefinable<T> = {
  [K in keyof T as IsDefinable<T[K], K, never>]: T[K];
};
export type StrictPickDefinable<T, Fallback = never> = IfNotEmptyObj<
  PickDefinable<T>,
  Fallback
>;

export type RecordWithoutKeys<
  Keys extends PropertyKey,
  T,
  ExcludeKeys extends PropertyKey,
> = Record<Keys, T> & Record<ExcludeKeys, never>;

// based on `Exact` here: https://github.com/joonhocho/tsdef/tree/master
// T is type that would usually be used `ex. U extends Record<string, any>`
// X is a self reference `U extends WithoutOverlap<BaseType, U, Other>`
// Other: type we don't want to have any overlapping keys with, grabs any keys that overlaps and intersects the objects, that way if the overlapping values match, then it will still work
export type WithoutOverlap<T, X extends T, Without> = {
  [K in Extract<keyof Without, keyof X>]: Without[K];
} & {
  [K in keyof X]: X extends keyof T ? X[K] : never;
};

// export type WithoutOverlap<T, X extends T, Overlap> =
// Record<keyof Overlap, never> & {
//   [K in keyof X]: X extends keyof T ? X[K] : never;
// };

export type PickAlwaysDefined<T> = {
  [K in keyof T as IsAlwaysDefined<T[K], K, never>]: T[K];
};
export type PickMostlyDefined<T> = {
  [K in keyof T as IsMostlyDefined<T[K], K, never>]: T[K];
};

// keeping only the definable values, making any maybeUnknown types optional
export type SmartPartial<T> = PickAlwaysDefined<T> &
  Partial<PickMostlyDefined<T>>;
// keeping only the definable values, makes any value that is only defined, into a required value
export type SmartRequired<T> = Required<PickAlwaysDefined<T>> &
  PickMostlyDefined<T>;
// keeps only definable values, setting them as optional/required depending on if they accept undefined
export type SmartMap<T> = Required<PickAlwaysDefined<T>> &
  Partial<PickMostlyDefined<T>>;
// strict versions of above
export type StrictSmartPartial<T, Fallback = never> = IfNotEmptyObj<
  SmartPartial<T>,
  Fallback
>;
export type StrictSmartRequired<T, Fallback = never> = IfNotEmptyObj<
  SmartRequired<T>,
  Fallback
>;
export type StrictSmartMap<T, Fallback = never> = IfNotEmptyObj<
  SmartMap<T>,
  Fallback
>;

export type MergeObjects<A, B> = IfNotNever<IfNotAny<A>, BlankObject> &
  IfNotNever<IfNotAny<B>, BlankObject>;
