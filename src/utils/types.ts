// Removes 'readonly' attributes from a type's properties
export type Mutable<Type> = {
  -readonly [Property in keyof Type]: Type[Property];
};
