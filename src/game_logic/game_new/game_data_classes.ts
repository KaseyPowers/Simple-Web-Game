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
function getExternalVal<T>(val: T): ExternalDataType<T> {
  // GameData instance returns it's own external data
  if (val instanceof GameData) {
    return val.getData() as ExternalDataType<T>;
  }

  // return array mapping
  if (Array.isArray(val)) {
    return val.map((childVal) => {
      return getExternalVal(childVal);
    }) as ExternalDataType<T>;
  }

  if (typeof val === "object") {
    const keys = Object.keys(val as object);
    return keys.reduce(
      (output, key) => {
        const nextVal = (val as Record<string, any>)[key];

        output[key] = getExternalVal(nextVal);
        return output;
      },
      {} as Record<string, any>,
    ) as ExternalDataType<T>;
  }

  // return primative types
  if (["string", "number", "boolean", "undefined"].includes(typeof val)) {
    return val as ExternalDataType<T>;
  }

  // catch-all return val
  throw new Error("Unexpected val type in getExternalVal" + val);
}
/* eslint-enable @typescript-eslint/no-unsafe-return */
/* eslint-enable @typescript-eslint/no-unsafe-assignment */
/* eslint-enable @typescript-eslint/no-explicit-any */

/**
 * Basic GameData class, to use either the raw data or the Derived data, doesn't use states in between
 */
export abstract class GameData<T, DT extends DerivedType<T> = DerivedType<T>> {
  readonly data: T;

  getData(): ExternalDataType<T> {
    return getExternalVal(this.data);
  }

  constructor(input: T) {
    this.data = input;
  }

  // get the derived value
  // initial thoughts for the type input type.
  abstract getDerived(): DT;
}

/**
 * Start extending with ways to define a sub-type of derived states
 */

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

type DefaultAccessKeys = (typeof defaultAccessTypes)[number];
// for simplicity only allow a tuple of strings and see if we run into cases that need more complex types
type DerivedGroupType = string | [string, string];

export abstract class GameDataDerived<
  T,
  DT extends DerivedType<T>,
  DerivedKeys extends DerivedGroupType = DefaultAccessKeys,
> extends GameData<T, DT> {
  abstract getDerived(type?: DerivedKeys): DT;
  // quick function to use for full/no access types. or as an example type.
  // ignores public since that will vary depending on the DT Type definition
  getDefaultAccess(type: Exclude<DefaultAccessKeys, "public">) {
    // full_access to return the raw data
    if (type === "full_access") {
      return this.getData();
    }
    if (type === "no_access") {
      return undefined;
    }
  }
}

export abstract class GameDataMemo<
  T,
  DT extends DerivedType<T>,
  DerivedKeys extends DerivedGroupType,
> extends GameDataDerived<T, DT, DerivedKeys> {
  // map to memoize the derived values of the data
  private derivedValues: Map<Parameters<typeof this.getDerived>, DT>;
  constructor(input: T) {
    super(input);
    // grab and wrap the function with a memoization function
    this.derivedValues = new Map();
    const originalDerived = this.getDerived.bind(this);
    this.getDerived = (...args) => {
      if (!this.derivedValues.has(args)) {
        this.derivedValues.set(args, originalDerived(...args));
      }
      // just casting value back to DT since we know that we set the value already (but can't check for undefined since that is a valid value)
      return this.derivedValues.get(args) as DT;
    };
  }
}
