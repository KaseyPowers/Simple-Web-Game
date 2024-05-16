export type NonEmptyWords = [string, ...rest: string[]];
export type SnakeCaseSeperator = "_";
export type KebabCaseSeperator = "-";

// Returns Str back if it's a string literal, otherwise returns Fallback
export type IfStringLiteral<Str, Fallback = never> = Str extends string
  ? string extends Str
    ? Fallback
    : Str
  : Fallback;
// Returns Str only if it's a literal string and not "";
export type IfNonEmptyString<Str, Fallback = never> = Str extends ""
  ? Fallback
  : IfStringLiteral<Str, Fallback>;
export type IsNonEmptyString<Str, True, False = never> =
  IfNonEmptyString<Str, false> extends false ? False : True;

// Add the input string to the end of the string array
export type PushString<Str, Current extends string[] = []> = Str extends string
  ? [...Current, Str]
  : Current;
// Only push non empty literal strings
export type StrictPushString<
  Str,
  Current extends string[] = [],
> = IsNonEmptyString<Str, PushString<IfNonEmptyString<Str>, Current>, Current>;

// Add the input string to the beginning of the string array
export type UnshiftString<
  Str,
  Current extends string[] = [],
> = Str extends string ? [Str, ...Current] : Current;
// Only push non empty literal strings
export type StrictUnshiftString<
  Str,
  Current extends string[] = [],
> = IsNonEmptyString<
  Str,
  UnshiftString<IfNonEmptyString<Str>, Current>,
  Current
>;

export type AddStringsWith<
  First extends string,
  Second extends string,
  Seperator extends string = "",
> = `${First}${Seperator}${Second}`;

export type JoinWordsWith<
  Words extends string[],
  Seperator extends string = "",
  Current extends string = "",
> = Words extends [infer Next, ...rest: infer Rest]
  ? Next extends string
    ? Rest extends NonEmptyWords
      ? JoinWordsWith<Rest, Seperator, AddStringsWith<Current, Next, Seperator>>
      : AddStringsWith<Current, Next, Seperator>
    : Current
  : Current;

export type JoinKebabCase<Words extends string[]> = JoinWordsWith<
  Words,
  KebabCaseSeperator
>;
export type JoinSnakeCase<Words extends string[]> = JoinWordsWith<
  Words,
  SnakeCaseSeperator
>;

// type CapitalizeWords<Words extends StringArrWithFirst

export type AllSeperators = " " | KebabCaseSeperator | SnakeCaseSeperator;

export type Trim<Str extends string, Seperator extends string = AllSeperators> =
  IsNonEmptyString<Seperator, 1, 0> extends 1
    ? Str extends `${Seperator}${infer InnerStr}`
      ? Trim<InnerStr, Seperator>
      : Str extends `${infer InnerStr}${Seperator}`
        ? Trim<InnerStr, Seperator>
        : Str
    : never;

export type IfTrimmed<
  Str extends string,
  Seperator extends string = AllSeperators,
  Fallback = never,
> = Trim<Str, Seperator> extends Str ? Str : Fallback;
export type IsTrimmed<
  Str extends string,
  True,
  False = never,
  Seperator extends string = AllSeperators,
> = IfTrimmed<Str, Seperator, 1> extends 1 ? True : False;

export type TrimPush<
  Str extends string,
  Seperator extends string = AllSeperators,
  Current extends string[] = [],
> = StrictPushString<Trim<Str, Seperator>, Current>;

type _Split<
  In extends string,
  Seperator extends string,
  Current extends string[] = [],
> = In extends `${infer Next}${Seperator}${infer Rest}`
  ? IsNonEmptyString<Rest, 1, 0> extends 1
    ? _Split<Trim<Rest>, Seperator, TrimPush<Next, Seperator, Current>>
    : TrimPush<Next, Seperator, Current>
  : StrictPushString<In, Current>;

export type Split<In extends string, Seperator extends string = AllSeperators> =
  IsNonEmptyString<Seperator, 1, 0> extends 1
    ? IsNonEmptyString<In, 1, 0> extends 1
      ? _Split<Trim<In>, Seperator>
      : never
    : never;
