// base of all game peices, an object with a (unique) ID
export interface BaseUniquePiece<ID = string> {
  id: ID;
}

export type GetIDFn<T, ID> = (piece: T) => ID;

type GetIDFromArr<T, K extends (keyof T)[]> = {
  [I in keyof K]: K[I] extends keyof T ? T[K[I]] : never;
};
export type GetIDFromKey<
  T,
  K extends keyof T | (keyof T)[],
> = K extends (keyof T)[]
  ? GetIDFromArr<T, K>
  : K extends keyof T
    ? T[K]
    : never;
