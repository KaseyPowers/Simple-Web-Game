/* eslint-disable @typescript-eslint/no-explicit-any */
import type {
  GameDataType,
  BaseGameDataType,
  DerivedType,
  DerivedGroupType,
  ExternalDataType,
} from "./types";

import { copyData, getData } from "./utils";

/**
 * Basic GameData class, to use either the raw data or the Derived data, doesn't use states in between
 */

export abstract class GameData<
  T extends BaseGameDataType = BaseGameDataType,
  DT extends DerivedType<T> = DerivedType<T>,
  DKeys extends DerivedGroupType | undefined = undefined,
  ET extends ExternalDataType<T> = ExternalDataType<T>,
> {
  private readonly _data: T;
  // getter to get reference to data
  get data() {
    return this._data;
  }
  static copy<I extends GameData>(current: I): I {
    const currentData = current.copyData();
    const copyClass = new (current.constructor as new (
      data: typeof currentData,
    ) => I)(currentData);
    return copyClass;
  }
  // make a copy of the data
  copyData(): T {
    return copyData(this.data);
  }
  // get external data
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
  abstract getDerived(type?: DKeys): undefined | DT | ET;
}

// default access control types
export const defaultAccessTypes = [
  "public",
  "full_access",
  "no_access",
] as const;
export type DefaultAccessKeys = (typeof defaultAccessTypes)[number];

type SimpleGameDKeys<DKeys extends DerivedGroupType | undefined> =
  | (DKeys extends undefined ? never : DKeys)
  | DefaultAccessKeys;
// GameData with the default access control set up to
export abstract class SimpleGameData<
  T,
  DT extends DerivedType<T> = DerivedType<T>,
  DKeys extends DerivedGroupType | undefined = undefined,
  ET extends ExternalDataType<T> = ExternalDataType<T>,
> extends GameData<T, DT, SimpleGameDKeys<DKeys>, ET> {
  // get the derived value
  // initial thoughts for the type input type.
  getDerived(type?: SimpleGameDKeys<DKeys>) {
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

  abstract getPublicDerived(type?: DKeys): DT;
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
