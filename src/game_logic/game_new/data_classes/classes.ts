import type {
  DataType,
  BaseDataType,
  InnerDataType,
  GetInnerType,
  GetExternalType,
} from "./types";
import { createRecursive, getCustomClassPiece } from "./utils/create_recursive";

export class DataClass<Type = BaseDataType> {
  private readonly _data: Type;
  get data() {
    return this._data;
  }
  constructor(data: Type) {
    this._data = data;
  }
  // create a static functions for the recursive data functions
  // NOTE: Because these deal with general types, there is some casting between them and the specific type for the class instance
  static copyData = createRecursive<DataType>({
    onDataClass: (input) => input.copy(),
  });
  static innerData = createRecursive<InnerDataType>({
    onDataClass: (input) => input.innerData() as InnerDataType,
  });

  copyData(): Type {
    return DataClass.copyData(this.data) as Type;
  }
  innerData(): GetInnerType<Type> {
    // recursive function makes these into simple InnerDataType, but here we convert back to the specific type
    return DataClass.innerData(this.data) as GetInnerType<Type>;
  }
  // make a copy of this class with new data
  copyWith(newData: Type) {
    return new (this.constructor as new (data: Type) => this)(newData);
  }
  // copy the current data unchanged
  copy() {
    return this.copyWith(this.copyData());
  }
}

export abstract class GameDataClass<
  Type extends BaseDataType,
  ExternalType = GetExternalType<Type>,
> extends DataClass<Type> {
  static externalData = createRecursive<InnerDataType>({
    onCustom: [
      getCustomClassPiece(
        GameDataClass,
        (input) => input.externalData() as InnerDataType,
      ),
    ],
    onDataClass: (input) => input.innerData() as InnerDataType,
  });
  abstract externalData(): ExternalType;
}

const testOnGameDataClass = getCustomClassPiece<
  InnerDataType,
  typeof GameDataClass
>(GameDataClass, (input) => input.externalData());

class TestClass extends GameDataClass<number, string> {
  externalData() {
    return "hello world";
  }
}

const testInstance = new TestClass(5);

const isDataClass = testInstance instanceof DataClass;
