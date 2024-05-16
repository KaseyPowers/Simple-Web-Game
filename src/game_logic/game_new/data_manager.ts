export class DataManager<Data, DataChange> {
  defaultData?: Data;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  initializeData?: (...args: any[]) => Data;

  protected mergeAnyData<T extends Data | DataChange>(input: T, toMerge?: T | DataChange): T {
    return {
      ...input,
      ...toMerge
    }
  };
  copy: (input: Data) => Data = (input) => this.mergeAnyData(input);
  merge: (input: Data, toMerge: Data) => Data = (input, toMerge) => this.mergeAnyData(input, toMerge);
  
  copyChange: (input: DataChange) => DataChange = (input) => this.mergeAnyData(input);
  mergeChanges: (input: DataChange, toMerge: DataChange) => DataChange = (input, toMerge) => this.mergeAnyData(input, toMerge);
  
  mergeWithChange: (input: Data, toMerge: DataChange) => Data = (input, toMerge) => this.mergeAnyData(input, toMerge);
  }
}

export type GetDataType<T extends DataManager<unknown, unknown>> =
  T extends DataManager<infer Data, unknown> ? Data : never;
export type GetDataChangeType<T extends DataManager<unknown, unknown>> =
  T extends DataManager<unknown, infer DataChange> ? DataChange : never;

export abstract class DerivedDataManager<
  Data,
  DerivedData,
  DataChange,
  DerivedChange,
> extends DataManager<Data, DataChange> {
  abstract toDerived(input: Data): DerivedData;
  // optional second argument to get the "current" data before the change, in case we need to use it for calculated values;
  abstract toDerivedChange(input: DataChange, changeFrom: Data): DerivedChange;
  // abstract toDerivedChange(input: DataChange): DerivedChange;
  copyDerivedChange(input: DerivedChange) {
    return {...input};
  }
  mergeDerivedChange(
    input: DerivedChange,
    toMerge: DerivedChange,
  ): DerivedChange {
    return {
      ...input,
      ...toMerge,
    };
  }
}

export type GetDerivedType<
  T extends DerivedDataManager<unknown, unknown, unknown, unknown>,
> =
  T extends DerivedDataManager<unknown, infer Derived, unknown, unknown>
    ? Derived
    : never;
export type GetDerivedChangeType<
  T extends DerivedDataManager<unknown, unknown, unknown, unknown>,
> =
  T extends DerivedDataManager<unknown, unknown, unknown, infer DerivedChange>
    ? DerivedChange
    : never;

export class DataClass<
  Data,
  DataChange,
  Manager extends DataManager<Data, DataChange> = DataManager<Data, DataChange>
> {
  readonly manager: Manager;
  protected readonly data: Data;
  constructor(manager: Manager, input: Data) {
    this.manager = manager;    
    this.data = Object.freeze(input);
    
  }
  getData(change?: DataChange) {
    const current = this.manager.copy(this.data);
    if (change) {
      return this.manager.mergeWithChange(current, change);
    }
    return current;
  }
  copy(changes?: DataChange) {
    return new (this.constructor as new (manager: Manager, input: Data) => this)(
      this.manager, this.getData(changes),
    );
  }
  applyChange(change: DataChange) {
    return this.copy(change);
  }
}

export class DerivedDataClass<Data, DerivedData, DataChange, DerivedChange, Manager extends DerivedDataManager<Data, DerivedData, DataChange, DerivedChange> = DerivedDataManager<Data, DerivedData, DataChange, DerivedChange>> extends DataClass<Data, DataChange, Manager>  {

  getDerivedData(): DerivedData {
    return this.manager.toDerived(this.getData());
  }

  getDerivedDataChange(input: DataChange): DerivedChange {
    return this.manager.toDerivedChange(input, this.getData());
  }
}
