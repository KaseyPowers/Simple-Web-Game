import type { DeepPartial } from "~/utils/types";
import type { DataClass, DerivedPublicKey } from "./data_class";

// export type DerivedTypesObj<
//   PublicType,
//   ExternalType = PublicType,
//   // key options listed in order of how often they would be used/needed
//   MixedKeys extends string = never,
//   ExternalKeys extends string = never,
//   PublicKeys extends string = never,
// > = {
//   [K in DerivedPublicKey]: PublicType;
// } & (MixedKeys | ExternalKeys | PublicKeys) extends never
//   ? undefined
//   : {
//       [K in Exclude<
//         MixedKeys | ExternalKeys | PublicKeys,
//         DerivedPublicKey
//       >]: K extends MixedKeys
//         ? PublicType | ExternalType
//         : K extends ExternalKeys
//           ? ExternalType
//           : K extends PublicKeys
//             ? PublicType
//             : never;
//     };

export type DerivedTypesObj<
  PublicType,
  ExternalType = PublicType,
  // key options listed in order of how often they would be used/needed
  MixedKeys extends string = never,
  ExternalKeys extends string = never,
  PublicKeys extends string = never,
> = {
  [K in
    | DerivedPublicKey
    | MixedKeys
    | ExternalKeys
    | PublicKeys]: K extends DerivedPublicKey
    ? PublicType
    : K extends MixedKeys
      ? PublicType | ExternalType
      : K extends ExternalKeys
        ? ExternalType
        : K extends PublicKeys
          ? PublicType
          : never;
};

export type DerivedTypesExtendableDefault = DerivedTypesObj<
  unknown,
  unknown,
  string,
  string,
  string
>;

export type DerivedChangeType<
  Type extends DerivedTypesExtendableDefault,
  ExcludeType = never,
> = DeepPartial<Type, ExcludeType>;

/* eslint-disable @typescript-eslint/no-explicit-any */
// export type InnerData<Type> =
//   Type extends DataClass<infer T, any>
//     ? T
//     : Type extends Record<PropertyKey, unknown> | unknown[]
//       ? {
//           [K in keyof Type]: InnerData<Type[K]>;
//         }
//       : Type;
/* eslint-enable @typescript-eslint/no-explicit-any */

// The DataChange is a partial object with DataClass stripped out
export type DataChangeType<Type, ExcludeType = never> = DeepPartial<
  // InnerData<Type>,
  Type,
  ExcludeType
>;
// The full change type we pass around, a tuple with the state change and derived changes
export type FullChangeType<
  Type,
  Derived extends DerivedTypesExtendableDefault,
  DataChange = DataChangeType<Type>,
  DerivedChange = DerivedChangeType<Derived>,
> = [DataChange, DerivedChange];
