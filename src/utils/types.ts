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
