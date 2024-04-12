/* eslint-disable @typescript-eslint/no-explicit-any */
import type {
  GameDataType,
  BaseGameDataType,
  DerivedType,
  DerivedGroupType,
  ExternalDataType,
  GetGameDerivedType,
} from "./types";

import { copyData, getData } from "./utils";

/**
 * Basic GameData class, to use either the raw data or the Derived data, doesn't use states in between
 */

export abstract class GameData<
  T extends BaseGameDataType = BaseGameDataType,
  DT = DerivedType<T>,
  ET = ExternalDataType<T>,
  DerivedKeys extends DerivedGroupType | undefined = undefined,
> {
  private readonly _data: T;
  // assume this will be okay later
  get data() {
    return this._data;
  }
  copyData(): T {
    return copyData(this.data);
  }

  getData(): ET {
    return getData(this.data);
  }

  constructor(data: T) {
    this._data = data;
  }

  // get the derived value
  // thoughts for derivedKeys structure defined elsewhere
  // assume that returning undefined or the full external type is always available
  // therefor DT can be considered defining "public" (if using basic all/nothing/public option), or the potential responses for not all/nothing extremes
  abstract getDerived(type?: DerivedKeys): undefined | DT | ET;
}

// default access control types
export const defaultAccessTypes = [
  "public",
  "full_access",
  "no_access",
] as const;
export type DefaultAccessKeys = (typeof defaultAccessTypes)[number];

// GameData with the default access control set up to
export abstract class SimpleGameData<
  T extends BaseGameDataType = BaseGameDataType,
  DT = DerivedType<T>,
  ET = ExternalDataType<T>,
  DerivedKeys extends undefined | DerivedGroupType = undefined,
> extends GameData<
  T,
  DT,
  ET,
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

type GameDataTypeArgs<
  Type extends BaseGameDataType,
  Derived = DerivedType<Type>,
  External = ExternalDataType<Type>,
  DerivedKeys extends DerivedGroupType | undefined = undefined,
> = {
  data: Type;
  derived?: Derived;
  derivedKeys?: DerivedKeys;
  external?: External;
};
type GetArgVal<Arg extends GameDataTypeArgs<any>, Key extends keyof Arg> =
  Arg extends GameDataTypeArgs<any> ? Arg[Key] : never;

type GetData<Args extends GameDataTypeArgs<any>, Type> =
  GetArgVal<Args, "data"> extends BaseGameDataType ? Args["data"] : Type;
// type GetDerived<Args extends GameDataTypeArgs<any>, Type> = GetArgVal<Args, "derived"> extends DerivedType<GetData<Args, Type>> ? Args["derived"] : DerivedType<GetData<Args, Type>>;
type GetDerived<Args extends GameDataTypeArgs<any>, Type> =
  Args["derived"] extends DerivedType<GetData<Args, Type>>
    ? Args["derived"]
    : DerivedType<GetData<Args, Type>>;
// type GetExternal<Args extends GameDataTypeArgs<any>, Type> = GetArgVal<Args, "external"> extends DerivedType<GetData<Args, Type>> ? Args["derived"] : DerivedType<GetData<Args, Type>>;

class GameDataNew<
  IArgs extends GameDataTypeArgs<T>,
  T extends BaseGameDataType = BaseGameDataType,
> {
  readonly data: GetData<IArgs, T>;

  getDerived(): GetDerived<IArgs, T> {
    return null as any;
  }

  constructor(
    input: IArgs["data"] extends BaseGameDataType ? IArgs["data"] : T,
  ) {
    this.data = input;
  }
}

const testInstance = new GameDataNew<{ data: string[]; external: number }>([]);
const testData = testInstance.data;
const testDerived = testInstance.getDerived();
