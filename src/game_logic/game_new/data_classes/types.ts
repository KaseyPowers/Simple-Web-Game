/* eslint-disable @typescript-eslint/no-explicit-any */
import type { DataClass, GameDataClass } from "./classes";

export type DataTypePrimatives = string | number | boolean | null | undefined;
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface GetObjType<Type> extends Record<string, Type> {}

// like DataType without mixing in the DataClass
export type InnerDataType =
  | DataTypePrimatives
  | InnerDataType[]
  | GetObjType<InnerDataType>
  | Set<InnerDataType>
  | Map<any, InnerDataType>;

export type BaseDataType =
  | DataTypePrimatives
  | DataType[]
  | GetObjType<DataType>
  | Set<DataType>
  | Map<any, DataType>;

export type DataType = BaseDataType | DataClass<BaseDataType>;

// the recursive(?) InnerType definiton, not sure if needed or just the InnerDataType above is better?
export type GetInnerType<Type extends DataType> =
  Type extends DataClass<infer Data>
    ? Data
    : Type extends Record<string, DataType>
      ? { [Property in keyof Type]: GetInnerType<Type[Property]> }
      : Type extends Map<infer K, infer V extends DataType>
        ? Map<K, GetInnerType<V>>
        : Type extends Set<infer V extends DataType>
          ? Set<GetInnerType<V>>
          : Type;

/** GameData types */
export type GetExternalType<Type extends DataType> =
  Type extends GameDataClass<any, infer ET>
    ? ET
    : Type extends Record<string, DataType>
      ? { [Property in keyof Type]: GetExternalType<Type[Property]> }
      : Type extends Map<infer K, infer V extends DataType>
        ? Map<K, GetExternalType<V>>
        : Type extends Set<infer V extends DataType>
          ? Set<GetExternalType<V>>
          : Type;
