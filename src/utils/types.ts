// Removes 'readonly' attributes from a type's properties
export type Mutable<Type> = {
  -readonly [Property in keyof Type]: Type[Property];
};

export type PartPartial<T, K extends keyof T> = {
  [P in keyof T]: T[K] | (P extends K ? undefined : never);
};

// export type PartialExcept<T, K extends keyof T> = {
//   [P in keyof T]: T[K] | (P extends K ? never : undefined);
// };
// combo of build in TS utility types to see if my custom type was causing issues
export type PartialExcept<T, K extends keyof T> = Partial<Omit<T, K>> &
  Pick<T, K>;

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

export type UnPartial<Type> = {
  [K in keyof Type]-?: Type[K];
};

export type KeysWithIgnorePartial<T, Type> = KeysWith<UnPartial<T>, Type>;

export type DeepPartial<Type, ExceptTypes = never> = Type extends ExceptTypes
  ? Type
  : Type extends object | unknown[]
    ? {
        [K in keyof Type]?: DeepPartial<Type[K], ExceptTypes>;
      }
    : Type;

// export type IfType<Input, Type, If = Input, Else = never> = Input extends Type
//   ? Type extends Input
//     ? If
//     : Else
//   : Else;

export type IfType<Input, Type, If = Input, Else = never> = Input extends Type
  ? If
  : Else;
