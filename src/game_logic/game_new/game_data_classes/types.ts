/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Initial thoughts on the derived identifier:
 * undefined = public/glabal state
 * [enum]: TODO: Some enum for the category of derived value. For broad catagories like <GroupOfPlayers> or <HasAccess> (for when the condition is that the requester has full access but too deep in structure to verify details)
 * [enum, id]: To Extend the above enum with details. For example [<PlayerIdAcess>, playerId] to verify their access or control what children have access
 */
// for simplicity only allow a tuple of strings and see if we run into cases that need more complex types
export type DerivedGroupType = string | [string, string];

import type { GameData } from "./classes";

export type DerivedType<Type> =
  // Get Type from class if Type is class instance
  Type extends GameData<Base>
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
  Type extends GameData<any>
    ? ReturnType<Type["getData"]>
    : Type extends Record<any, any>
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
