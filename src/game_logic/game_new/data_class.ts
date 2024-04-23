import { DeepPartial, IfType } from "~/utils/types";

// return a default shallow merge of objects
export function getDefaultMergeItem<
  Type,
  ChangeType extends DeepPartial<Type>,
>() {
  return function <T extends Type | ChangeType>(
    current: T,
    next?: IfType<T, Type, Type | ChangeType, ChangeType>,
  ): T {
    return {
      ...current,
      ...next,
    };
  };
}

export function getDefaultMerge<Type, ChangeType extends DeepPartial<Type>>(
  itemFn: ReturnType<typeof getDefaultMergeItem<Type, ChangeType>>,
) {
  return function merge<T extends Type | ChangeType>(
    current: T,
    ...toMerge: IfType<T, Type, Type | ChangeType, ChangeType>[]
  ): T {
    let output = itemFn(current);
    toMerge.forEach((next) => {
      output = itemFn(output, next);
    });
    return output;
  };
}

export class DataOnlyClass<
  Data,
  DataChange extends DeepPartial<Data> = DeepPartial<Data>,
> {
  readonly data: Readonly<Data>;
  constructor(input: Data) {
    this.data = Object.freeze(input);
  }
  // get a copy of data, can be called with changes to apply to the data before returning
  getData(...changes: (Data | DataChange)[]): Data {
    return this.mergeData(this.data, ...changes);
  }
  // return a new class instance, using the current data, with changes applied if provided
  applyChanges(...changes: DataChange[]): this {
    return new (this.constructor as new (input: Data) => this)(
      this.getData(...changes),
    );
  }
  // copy function as alias of applyChanges, (NOTE: Not sure if best approach for this?)
  copy: typeof this.applyChanges = (...args) => this.applyChanges(...args);

  // merge functions for data type or changes
  mergeDataItem = getDefaultMergeItem<Data, DataChange>();
  mergeData = getDefaultMerge<Data, DataChange>(this.mergeDataItem);
}

/* eslint-disable @typescript-eslint/no-explicit-any */
export type ActionFnType<
  Data,
  DataChange,
  Args extends any[] = any[],
  Output extends any[] = any[],
> = (input: Data, ...args: Args) => [...other: Output, DataChange];

type ActionTypeParams<Type extends ActionFnType<any, any>> =
  Type extends ActionFnType<any, any, infer Params> ? Params : never;

export function createActionsClass<Data, DataChange extends DeepPartial<Data>>(
  Base: new (...args: any[]) => DataOnlyClass<Data, DataChange>,
) {
  return function withActions<
    AllActions extends Record<string, ActionFnType<Data, DataChange>>,
  >(actions: AllActions) {
    return class DataAction extends Base {
      actions = actions;

      onAction<K extends keyof AllActions>(
        name: K,
        input: Data | DataChange | (Data | DataChange)[],
        ...args: ActionTypeParams<AllActions[K]>
      ): ReturnType<AllActions[K]>;

      onAction<K extends keyof AllActions>(
        name: K,
        input: Data | DataChange | (Data | DataChange)[],
        ...args: ActionTypeParams<AllActions[K]>
      ) {
        const fn = actions[name];
        if (!fn) {
          throw new Error("name was not found in actions");
        }
        const allChanges = Array.isArray(input) ? [...input] : [input];
        const useData = this.getData(...allChanges);
        return fn(useData, ...args) as ReturnType<AllActions[K]>;
      }
    };
  };
}
/* eslint-enable @typescript-eslint/no-explicit-any */

export abstract class DataClass<
  Data,
  DerivedData,
  DataChange extends DeepPartial<Data> = DeepPartial<Data>,
  DerivedChange extends DeepPartial<DerivedData> = DeepPartial<DerivedData>,
> extends DataOnlyClass<Data, DataChange> {
  mergeDerivedDataItem = getDefaultMergeItem<DerivedData, DerivedChange>();
  mergeDerivedData = getDefaultMerge<DerivedData, DerivedChange>(
    this.mergeDerivedDataItem,
  );

  abstract createDerivedData(input: Data): DerivedData;
  abstract createDerivedChange(input: DataChange): DerivedChange;

  getChanges(input: DataChange): [DataChange, DerivedChange] {
    return [input, this.createDerivedChange(input)];
  }

  mergeChanges(
    current: [DataChange, DerivedChange],
    ...toMerge: [DataChange, DerivedChange][]
  ): [DataChange, DerivedChange] {
    return [
      this.mergeData(current[0], ...toMerge.map((val) => val[0])),
      this.mergeDerivedData(current[1], ...toMerge.map((val) => val[1])),
    ];
  }
}
