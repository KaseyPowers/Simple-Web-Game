/* eslint-disable @typescript-eslint/no-explicit-any */
import type { GameData } from "./classes";

// the recursive(?) InnerType definiton, not sure if needed or just the InnerDataType above is better?
export type GetInnerType<Type> =
  Type extends GameData<infer Data>
    ? Data
    : Type extends Record<string, any>
      ? { [Property in keyof Type]: GetInnerType<Type[Property]> }
      : Type extends Map<infer K, infer V>
        ? Map<K, GetInnerType<V>>
        : Type extends Set<infer V>
          ? Set<GetInnerType<V>>
          : Type;

/** GameData types */
export type GetExternalType<Type> =
  Type extends GameData<any, infer ET>
    ? ET
    : Type extends Record<string, any>
      ? { [Property in keyof Type]: GetExternalType<Type[Property]> }
      : Type extends Map<infer K, infer V>
        ? Map<K, GetExternalType<V>>
        : Type extends Set<infer V>
          ? Set<GetExternalType<V>>
          : Type;

export type SizeableType = Array<any> | Map<any, any> | Set<any>;
export type DefaultDerivedType<Type = any> = Type extends SizeableType
  ? number
  : undefined;

export type GetPublicDerived<Type> =
  undefined | Type extends GameData<any, any, infer PT>
    ? PT
    : Type extends Record<string, any>
      ? { [Property in keyof Type]: GetPublicDerived<Type[Property]> }
      : Type extends Map<infer K, infer V>
        ? Map<K, GetPublicDerived<V>>
        : Type extends Set<infer V>
          ? Set<GetPublicDerived<V>>
          :
              | Type
              | (Type extends
                  | Array<unknown>
                  | Map<unknown, unknown>
                  | Set<unknown>
                  ? number
                  : never);
