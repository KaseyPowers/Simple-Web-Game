import type { IfNotEmptyObj, IfNotAny } from "./type_checks";
// returns type if it's a string literal
export type IfStringLiteral<T, Fallback = never> = T extends string
  ? string extends T
    ? Fallback
    : T
  : Fallback;
export type IsStringLiteral<T, True, False = never> =
  IfStringLiteral<T, 0> extends 0 ? False : True;

// defining as a type to keep spreading unions
type IfNotEmptyString<T, Fallback = never> = T extends "" ? Fallback : T;
// NOTE: Not passing fallback to IfStringLiteral so that it's safely never, otherwise I feel like it could get odd if Fallback is passed into IfNotEmptyString?
// Returns type (distributive) if it's a string literanl and not "". Otherwise Fallback.
export type IfStringNotEmpty<T, Fallback = never> = IfNotEmptyString<
  IfStringLiteral<T, Fallback>,
  Fallback
>;
// for a distributive type, the pattern is reversed so that `if` type works as expected
export type IsStringNotEmpty<T, True, False = never> =
  IfStringNotEmpty<T> extends never ? False : True;

// returns true if all properties in union are string literals
export type IsOnlyStringLiteral<T, True, False = never> =
  0 extends IfStringLiteral<T, 0> ? False : True;

export type IfOnlyStringLiteral<T, Fallback = never> = IsOnlyStringLiteral<
  T,
  T,
  Fallback
>;

// returns input type only if it's a capitalized string
export type IfCapitalizedStr<Str, Fallback = never> =
  Str extends Capitalize<string & Str> ? Str : Fallback;
// returns input type onfly if it's an uncapitalized string
export type IfUncapitalizedStr<Str, Fallback = never> =
  Str extends Uncapitalize<string & Str> ? Str : Fallback;

// returns True if input only has specified string type

// returns the string back only if all values (for unions) as capitalized strings
export type IsOnlyCapitalizedStr<Str extends string, True, False = never> =
  0 extends IfCapitalizedStr<Str, 0> ? False : True;
export type IfOnlyCapitalizedStr<
  Str extends string,
  Fallback = never,
> = IsOnlyCapitalizedStr<Str, Str, Fallback>;
// returns the string back only if all values (for unions) as uncapitalized strings
export type IsOnlyUncapitalizedStr<Str extends string, True, False = never> =
  0 extends IfUncapitalizedStr<Str, 0> ? False : True;
export type IfOnlyUncapitalizedStr<
  Str extends string,
  Fallback = never,
> = IsOnlyUncapitalizedStr<Str, Str, Fallback>;

/** 
 * NOTE: Later I might want to turn this into an array based logic, with this prefix represented by [Prefix, string]
 * This would allow for fancier logic with mixing prefix/suffixes and checking multiple values
 * 
 * For example, these functions from `get<>DerivedState` could become ["get", string, "Derived", "State"]
 * 
 * type ToDerivedFnStr<Str extends string> = Str extends ""
    ? never
    : Str extends `get${infer I}`
      ? GetDerivedFnStr<I>
      : Str extends `${infer I}State`
        ? GetDerivedFnStr<I>
        : Str extends `${infer I}Derived`
          ? GetDerivedFnStr<I>
          : `get${Capitalize<Str>}DerivedState`;
  // wrap with check for string literal, becomes recursive
  type GetDerivedFnStr<Type> = ToDerivedFnStr<IfStringLiteral<Type>>;
 */
type _IsPrefixValid<Prefix, True, False = never> =
  1 extends IfStringNotEmpty<Prefix, 1> ? False : True;
// if applying prefixes, expect Str to be a string literal without prefix, unless the word already has the prefix in it, in that case, we expect it to be applied ahead of time. Ex. prefix: "on" and "one" would expect "onOne" as input

// expect after prefix validation
type _CanPrefixStrInner<
  Str,
  Prefix extends string,
  Fallback = never,
> = Str extends string
  ? Str extends `${Prefix}${infer Inner}`
    ? Inner extends `${Capitalize<Prefix>}${string}`
      ? Str
      : Fallback
    : IfStringNotEmpty<Str, Fallback>
  : Fallback;
// Valiadte the prefix and pass along
type _CanPrefixStr<Str, Prefix, Fallback = never> = _IsPrefixValid<
  Prefix,
  _CanPrefixStrInner<Str, string & Prefix, Fallback>,
  Fallback
>;

// Innermost logic, expect prefix and strings to be validated already
type _PrefixStrInner<
  Str extends string,
  Prefix extends string,
  Fallback = never,
> = Str extends `${Prefix}${infer Inner}`
  ? Inner extends `${Capitalize<Prefix>}${string}`
    ? Str
    : Fallback
  : `${Prefix}${Capitalize<Str>}`;

// validate the Str/Prefix, making hard stop for prefix, and spread Str to only keep the valid options
type _PrefixStr<Str, Prefix, Fallback = never> = _IsPrefixValid<
  Prefix,
  Str extends string
    ? IsStringNotEmpty<
        Str,
        _PrefixStrInner<Str, Prefix & string, Fallback>,
        Fallback
      >
    : Fallback,
  Fallback
>;

// since the prefix logic is strict on string literals, this helper will create the generic string type for a prefix
export type PrefixDefaultStr<Prefix> = _PrefixStr<
  string,
  IfStringNotEmpty<
    | IfOnlyCapitalizedStr<string & Prefix>
    | IfOnlyUncapitalizedStr<string & Prefix>
  >
>;

// convert the incoming strings with the provided prefix, converting everything to Uncapitalized first to make sure it's CamelCased
export type PrefixStrCamel<Str, Prefix, Fallback = never> = _PrefixStr<
  Uncapitalize<IfStringNotEmpty<Str>>,
  Uncapitalize<IfStringNotEmpty<Prefix>>,
  Fallback
>;
export type CanPrefixCamel<Str, Prefix, Fallback = never> = Str extends string
  ? _CanPrefixStr<Uncapitalize<Str>, Uncapitalize<string & Prefix>, 1> extends 1
    ? Fallback
    : Str
  : Fallback;

// convert incoming strings with the provided prefix, converting everything to Capitalized first to make sure it's propertly PascalCased
export type PrefixStrPascal<Str, Prefix, Fallback = never> = _PrefixStr<
  Capitalize<IfStringNotEmpty<Str>>,
  Capitalize<IfStringNotEmpty<Prefix>>,
  Fallback
>;

export type CanPrefixPascal<Str, Prefix, Fallback = never> = Str extends string
  ? _CanPrefixStr<Capitalize<Str>, Capitalize<string & Prefix>, 1> extends 1
    ? Fallback
    : Str
  : Fallback;

// Will prefix the provided strings based on the casing of the provided Prefix, can handle a union of prefixes, but they must all be the same case
export type PrefixStr<Str, Prefix, Fallback = never> =
  IsOnlyUncapitalizedStr<string & Prefix, 1, 0> extends 1
    ? PrefixStrCamel<Str, Prefix, Fallback>
    : IsOnlyCapitalizedStr<string & Prefix, 1, 0> extends 1
      ? PrefixStrPascal<Str, Prefix, Fallback>
      : Fallback;

export type CanPrefixStr<
  Str,
  Prefix,
  Fallback = never,
> = IsOnlyUncapitalizedStr<
  string & Prefix,
  CanPrefixCamel<Str, Prefix, Fallback>,
  IsOnlyCapitalizedStr<
    string & Prefix,
    CanPrefixPascal<Str, Prefix, Fallback>,
    Fallback
  >
>;

// will only return if all the strings provided are valid as inputs for prefixing
// export type StrictCanPrefix<Str, Prefix, Fallback = never> = 0 extends IfCanPrefixStr<Str, Prefix, 0> ? Fallback : Str;
export type StrictCanPrefix<Str, Prefix, Fallback = never> =
  1 extends CanPrefixStr<Str, Prefix, 1> ? Fallback : Str;

export type StrictPrefixStr<
  Str,
  Prefix,
  Fallback = never,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- using any overriding things in unions to make any failed validation turn it all into `any`
> = IfNotAny<PrefixStr<Str, Prefix, any>, Fallback>;

// will remap all valid keys in the object
export type PrefixRemap<Obj extends Record<string, unknown>, Prefix> = {
  [K in keyof Obj as PrefixStr<K, Prefix>]: Obj[K];
};
// will remap with prefix, but only if all keys are valid to remap
export type StrictPrefixRemap<
  Obj extends Record<string, unknown>,
  Prefix,
  Fallback = never,
> = IfNotEmptyObj<
  {
    [K in StrictPrefixStr<keyof Obj, Prefix>]: Obj[K];
  },
  Fallback
>;
