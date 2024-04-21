/**
 * Based around the relationships between
 * Data - source of truth
 * PublicData - Minimum data shared with outside, what a bystander could see
 * GroupData - What could be sent to a group, so covers anything between PublicData and the maximum external facing data
 *
 *
 * Need functions for: (regular and partials for tracking changes)
 * Data -> PublicData
 * Data -> GroupData
 */
import type {
  MatchingInnerKeys,
  IfType,
  KeysWithIgnorePartial,
  UnPartial,
} from "~/utils/types";
import type {
  DataChangeType,
  DerivedChangeType,
  DerivedTypesExtendableDefault,
} from "./types";

export const derivedObjPublicKey = "publicData" as const;
export type DerivedPublicKey = typeof derivedObjPublicKey;

// simple starting class
export abstract class DataClass<
  Type,
  Derived extends DerivedTypesExtendableDefault,
  DataChange extends DataChangeType<Type> = DataChangeType<Type>,
  DerivedChange extends DerivedChangeType<Derived> = DerivedChangeType<Derived>,
> {
  readonly data: Readonly<Type>;
  // return a copy of the data object
  getData(...withChanges: DataChange[]): Type {
    return this.mergeData(this.data, ...withChanges);
  }
  getDerived() {
    return this.createDerivedFrom(this.data);
  }
  constructor(input: Type) {
    this.data = Object.freeze(input);
  }
  // create a copy of this instance with new data
  copyWith(input: Type): this {
    return new (this.constructor as new (input: Type) => this)(input);
  }

  applyChanges(...changes: DataChange[]) {
    return this.copyWith(this.getData(...changes));
  }
  // copy alias of apply changes
  copy: typeof this.applyChanges = (...args) => this.applyChanges(...args);

  // abstract functions around processing derived types
  abstract createDerivedFrom(input: Type): Derived;
  abstract createPartialDerived(input: DataChange): DerivedChange;

  // merge a Type or DataChange, if no second argument, can be used to copy the input
  mergeDataItem<T extends Type | DataChange>(
    current: T,
    next?: IfType<T, Type, Type | DataChange, DataChange>,
  ): T {
    return {
      ...current,
      ...next,
    };
  }
  // merge accepting many values to merge into the first value
  mergeData<T extends Type | DataChange>(
    current: T,
    ...toMerge: IfType<T, Type, Type | DataChange, DataChange>[]
  ): T {
    let output = this.mergeDataItem(current);
    toMerge.forEach((next) => {
      output = this.mergeDataItem(output, next);
    });
    return output;
  }

  /**
   * onChange Helpers. These can be used when building out the changes data in peices (ex. mixing in the results of a nested dataClass)
   * Most of these are either simple shallow merges or will throw an error if called without being defined.
   */

  // merging data assumes object types but can be overridden with more specific structures
  // utility function technically defined so it doesn't need to be defined unless it will be used. but can be useful when mixing in changs from child dataClasses
  mergeDerivedItem: <T extends Derived | DerivedChange>(
    current: T,
    next?: IfType<T, Derived, Derived | DerivedChange, DerivedChange>,
  ) => T = () => {
    throw new Error("Must define this function before it can be used");
  };

  mergeDerived<T extends Derived | DerivedChange>(
    current: T,
    ...toMerge: IfType<T, Derived, Derived | DerivedChange, DerivedChange>[]
  ): T {
    let output = this.mergeDerivedItem(current);
    toMerge.forEach((next) => {
      output = this.mergeDerivedItem(output, next);
    });
    return output;
  }

  mergeChanges(
    current: [DataChange, DerivedChange],
    ...toMerge: [DataChange, DerivedChange][]
  ): [DataChange, DerivedChange] {
    return [
      this.mergeData(current[0], ...toMerge.map((next) => next[0])),
      this.mergeDerived(current[1], ...toMerge.map((next) => next[1])),
    ];
  }

  // function setOutputVal<K1 extends keyof DerivedObj, K2 extends keyof DerivedObj[K1]>(outputKey: K1, valueKey: K2, value: DerivedObj[K1][K2]) {
  //     const currentObj: DeepPartial<DerivedObj>[K1] = (output[outputKey] ?? {});
  //     currentObj[valueKey] = value;
  //     output[outputKey] = currentObj;
  //   }
  setDerivedValue<
    K1 extends KeysWithIgnorePartial<DerivedChange, object>,
    K2 extends keyof UnPartial<DerivedChange>[K1],
  >(
    current: DerivedChange,
    outputKey: K1,
    valueKey: K2,
    value: DerivedChange[K1][K2],
  ) {
    // split out object and default it to an empty object
    const currentObj = (current[outputKey] ?? {}) as DerivedChange[K1];
    // set value in the object
    currentObj[valueKey] = value;
    // add object back to the outer structure
    current[outputKey] = currentObj;
  }

  setDerivedValueBulk<
    K1 extends KeysWithIgnorePartial<DerivedChange, object>,
    K2 extends MatchingInnerKeys<UnPartial<DerivedChange>, K1>,
  >(
    current: DerivedChange,
    outputKeys: K1[],
    valueKey: K2,
    value: DerivedChange[K1][K2],
  ) {
    outputKeys.forEach((key) => {
      this.setDerivedValue(current, key, valueKey, value);
    });
  }

  // Minimum/Common functions used, will need to define the main logic for creating the derived data change

  getChanges(dataChange: DataChange): [DataChange, DerivedChange] {
    // returns a tuple [changes, derivedChanges]
    return [dataChange, this.createPartialDerived(dataChange)];
  }

  // OnAction definitions? or leave that to the outermost layer
}
