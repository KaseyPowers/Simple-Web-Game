/* eslint-disable @typescript-eslint/no-explicit-any */
import type {
  GetExternalType,
  GetPublicDerived,
  DefaultDerivedType,
  SizeableType,
} from "./types";
import { createRecursive, getCustomClassPiece } from "./utils/create_recursive";

// default access control types
export const defaultAccessTypes = [
  "public",
  "full_access",
  "no_access",
] as const;
export type DefaultAccessKeys = (typeof defaultAccessTypes)[number];

export class GameData<
  Type = any,
  ExternalType = GetExternalType<Type>,
  PublicType = GetPublicDerived<Type>,
> {
  private readonly _data: Type;
  get data(): Type {
    return this._data;
  }
  constructor(data: Type) {
    this._data = Object.freeze(data);
  }
  // make a copy of this class with new data
  copyWith(newData: Type) {
    return new (this.constructor as new (data: Type) => this)(newData);
  }
  // The default behavior for non-class values works as a copy function.
  static copyData = createRecursive({
    onCustom: [getCustomClassPiece(GameData, (input) => input.copy())],
  });
  copyData(): Type {
    return GameData.copyData(this.data) as Type;
  }
  // copy the current data unchanged
  copy() {
    return this.copyWith(this.copyData());
  }
  // external data behavior. default recursive copies data and calls externalData when classes are found
  static externalData = createRecursive({
    onCustom: [getCustomClassPiece(GameData, (input) => input.externalData())],
  });
  // The external copy logic will return the data as-is unless there are classes with customized behavior
  externalData(): ExternalType {
    return GameData.externalData(this.data) as ExternalType;
  }
  //   static innerData = createRecursive({
  //     onCustom: [getCustomClassPiece(GameData, (input) => input.innerData())],
  //   });
  // NOTE: This might not be redundant with extenalData, will comment out for now
  //   innerData(): GetInnerType<Type> {
  //     // recursive function makes these into simple InnerDataType, but here we convert back to the specific type
  //     return GameData.innerData(this.data) as GetInnerType<Type>;
  //   }

  static defaultPublicDerived = createRecursive({
    onCustom: [
      getCustomClassPiece(GameData, (input) => input.getPublicDerived()),
    ],
    onPrimatives: false,
    onArray: (input) => input.length,
    onSet: (input) => input.size,
    // since we iterate on maps we could do the same for maps but this is simpler (until a map is used and proves me wrong)
    onMap: (input) => input.size,
    // catchAll returns undefined
    onCatch: () => undefined,
  });

  getPublicDerived(): PublicType {
    // want to keep the default value typed correctly, so I guess casting this as default behavior?
    return GameData.defaultPublicDerived(this.data) as PublicType;
  }

  // entry point for derived data. Using the default access keys. Will make another class that
  getDerived(type?: DefaultAccessKeys): undefined | ExternalType | PublicType {
    if (type === "full_access") {
      return this.externalData();
    }
    if (type === "no_access") {
      return undefined;
    }
    return this.getPublicDerived();
  }
}
