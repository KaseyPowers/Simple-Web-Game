/* eslint-disable @typescript-eslint/no-explicit-any */
export type DerivedType<Type> =
  // Get Type from class if Type is class instance
  Type extends GameData<any, unknown>
    ? ReturnType<Type["getDerived"]>
    : // map type object if object
      Type extends Record<any, unknown>
      ? {
          [Property in keyof Type]: DerivedType<Type[Property]>;
        }
      : // default type options
        | undefined
          | Type
          // arrays and array-like objects allow their length/size type as well
          | (Type extends unknown[] ? Type["length"] : never)
          | (Type extends { size: infer S } ? S : never);

// the basic external data type, it just returns the the same structure but flattens out GameData shapes
export type ExternalDataType<Type> =
  Type extends GameData<any, unknown>
    ? Type["data"]
    : Type extends Record<any, unknown>
      ? {
          [Property in keyof Type]: ExternalDataType<Type[Property]>;
        }
      : Type;

/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-empty-interface */
export type GameDataTypePrimatives =
  | string
  | number
  | boolean
  | null
  | undefined;
export type GameDataTypeArr = Array<GameDataType>;
// NOTE: TBD if we want to support maps/set types
// export type GameDataTypeSetMap = Set<GameDataType> | Map<unknown, GameDataType>;
export interface GameDataTypeObj extends Record<string, GameDataType> {}
export type BaseGameDataType =
  | GameDataTypePrimatives
  | GameDataTypeArr
  // | GameDataTypeSetMap
  | GameDataTypeObj;

export type GameDataType = BaseGameDataType | GameData<BaseGameDataType>;

export function copyData(input: GameDataType): GameDataType {
  if (input instanceof GameData) {
    return input.copyData();
  }
  if (Array.isArray(input)) {
    return input.map((childVal) => copyData(childVal));
  }
  // return primative types
  if (
    input === null ||
    typeof input === "string" ||
    typeof input === "number" ||
    typeof input === "boolean" ||
    typeof input === "undefined"
  ) {
    return input;
  }

  return Object.keys(input).reduce((output, key) => {
    const val = input[key];
    output[key] = copyData(val);
    return output;
  }, {} as GameDataTypeObj);
}

export function getData(input: GameDataType): ExternalDataType<typeof input> {
  if (input instanceof GameData) {
    return input.getData();
  }

  if (Array.isArray(input)) {
    return input.map((childVal) => getData(childVal));
  }
  // return primative types
  if (
    input === null ||
    typeof input === "string" ||
    typeof input === "number" ||
    typeof input === "boolean" ||
    typeof input === "undefined"
  ) {
    return input;
  }

  return Object.keys(input).reduce((output, key) => {
    const val = input[key];
    output[key] = getData(val);
    return output;
  }, {} as ExternalDataType<GameDataTypeObj>);
}

/* eslint-enable @typescript-eslint/no-unsafe-assignment */
/* eslint-enable @typescript-eslint/no-explicit-any */

/**
 * Initial thoughts on the derived identifier:
 * undefined = public/glabal state
 * [enum]: TODO: Some enum for the category of derived value. For broad catagories like <GroupOfPlayers> or <HasAccess> (for when the condition is that the requester has full access but too deep in structure to verify details)
 * [enum, id]: To Extend the above enum with details. For example [<PlayerIdAcess>, playerId] to verify their access or control what children have access
 */
// TODO: Figure this out better so we can predefine all the combinations (like socketIOs event maps without needing to use an object? if it's possible)
export const defaultAccessTypes = [
  "public",
  "full_access",
  "no_access",
] as const;
export type DefaultAccessKeys = (typeof defaultAccessTypes)[number];
// for simplicity only allow a tuple of strings and see if we run into cases that need more complex types
type DerivedGroupType = string | [string, string];

/**
 * Basic GameData class, to use either the raw data or the Derived data, doesn't use states in between
 */
export abstract class GameData<
  T extends BaseGameDataType,
  DT extends DerivedType<T> = DerivedType<T>,
  DerivedKeys extends DerivedGroupType | undefined = undefined,
> {
  readonly data: T;

  /** Don't love casting here but the Expected type made things cleaner in recursive functions, how to get best of both worlds? */
  copyData(): T {
    return copyData(this.data) as T;
  }

  getData(): ExternalDataType<T> {
    return getData(this.data) as ExternalDataType<T>;
  }

  constructor(input: T) {
    this.data = input;
  }

  // get the derived value
  // thoughts for derivedKeys structure defined elsewhere
  // assume that returning undefined or the full external type is always available
  // therefor DT can be considered defining "public" (if using basic all/nothing/public option), or the potential responses for not all/nothing extremes
  abstract getDerived(type?: DerivedKeys): DT | undefined | ExternalDataType<T>;
}
// instead of a new class, just a wrapper around the derived function that memoizes it.
export function memoizedGameData<T extends BaseGameDataType>(
  gameData: GameData<T>,
) {
  const originalDerived = gameData.getDerived.bind(gameData);
  const derivedValuesMap = new Map<
    Parameters<typeof originalDerived>,
    ReturnType<typeof originalDerived>
  >();
  gameData.getDerived = (...args: Parameters<typeof originalDerived>) => {
    if (!derivedValuesMap.has(args)) {
      derivedValuesMap.set(args, originalDerived(...args));
    }
    // ! non-null assertion to tell TS we know it's defined
    return derivedValuesMap.get(args)!;
  };
}

export abstract class SimpleGameData<
  T extends BaseGameDataType,
  DT extends DerivedType<T> = DerivedType<T>,
  DerivedKeys extends undefined | DerivedGroupType = undefined,
> extends GameData<
  T,
  DT,
  (DerivedKeys extends undefined ? never : DerivedKeys) | DefaultAccessKeys
> {
  // get the derived value
  // initial thoughts for the type input type.
  getDerived(type?: DefaultAccessKeys | DerivedKeys) {
    // full_access to return the raw data
    if (type === "full_access") {
      return this.getData();
    }
    if (type === "no_access") {
      return undefined;
    }
    return type === "public"
      ? this.getPublicDerived()
      : this.getPublicDerived(type);
  }

  abstract getPublicDerived(type?: DerivedKeys): DT;
}

/**
 * Predefining some simple base types:
 * - right now there is just the one so leaving it here, but should split to another file as we start to add more
 */

// simple array data type, with public type
export class StackedGameData<T extends GameDataType> extends SimpleGameData<
  T[],
  number
> {
  // basic derived
  getPublicDerived() {
    return this.data.length;
  }
}

// simple clas for arrays/maps/sets that returns a number for the derived value
// export class SizedGameData<T extends GameDataType> extends SimpleGameData<
//   T[] | Set<T> | (T extends Map<unknown, unknown> ? T : never),
//   number
// > {
//   // basic derived
//   getPublicDerived() {
//     return Array.isArray(this.data) ? this.data.length : this.data.size;
//   }
// }
