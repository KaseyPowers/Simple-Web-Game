/* eslint-disable @typescript-eslint/no-explicit-any */
import type { DataType, DataTypePrimatives } from "../types";
import { DataClass } from "../classes";
import { isDataTypePrimative, isDataTypeRecord } from ".";

// the base function type for the recursive function structure
type OnDataFn<R, T extends DataType = DataType> = (input: T) => R;
// function type to check if the input is the type we want to process in DataPieceFn
type IsDataPiece<T extends DataType = DataType> = (input: T) => boolean;
// what is used to process a piece of the data
// NOTE: could potentially add other args for helpers if they are needed
type DataPieceFn<R, T extends DataType = DataType> = (
  input: T,
  onData: OnDataFn<R>,
) => R;

type OnDataPiece<R, T extends DataType = DataType> = [
  isPiece: IsDataPiece<T>,
  onPiece: DataPieceFn<R, T>,
];

export function onArray<R>(input: DataType[], fn: OnDataFn<R>): R {
  return input.map(fn) as R;
}
export function onSet<R>(input: Set<DataType>, fn: OnDataFn<R>): R {
  const asArray = Array.from(input);
  return new Set(fn(asArray) as R[]) as R;
}

export function onMap<R>(input: Map<unknown, DataType>, fn: OnDataFn<R>): R {
  const entries = Array.from(input);
  const newEntires = entries.map<[unknown, R]>(([key, value]) => [
    key,
    fn(value),
  ]);
  return new Map(newEntires) as R;
}

export function onRecord<R>(
  input: Record<string, DataType>,
  fn: OnDataFn<R>,
): R {
  return Object.keys(input).reduce(
    (output, key) => {
      output[key] = fn(input[key]);
      return output;
    },
    {} as Record<string, R>,
  ) as R;
}

// input options for recursive function. Allowing for adding custom types, and for overriding/disabling default values
interface RecursivePiecesOptions<R> {
  // for passing in custom checkers
  onCustom?: OnDataPiece<R>[];
  onDataClass?: false | DataPieceFn<R, DataClass>;
  /**
   * Optional types: These have default functions to use
   * Primatives are sort of a special case, the default is to return the input as is. I'm sure there are fancy type checkings we can do for this but they wouldn't work at runtime?
   */
  onPrimatives?: false | DataPieceFn<R, DataTypePrimatives>;
  onArray?: false | DataPieceFn<R, DataType[]>;
  onSet?: false | DataPieceFn<R, Set<DataType>>;
  onMap?: false | DataPieceFn<R, Map<unknown, DataType>>;
  onObj?: false | DataPieceFn<R, Record<string, DataType>>;
}

type DataClassClassType<T> = T extends abstract new (...args: any) => infer R
  ? R extends DataClass
    ? T
    : never
  : never;
// function split so that we can use it in optionsToPieces without the warning
function makeClassPiece<R, T extends DataClassClassType<typeof DataClass>>(
  UseClass: DataClassClassType<T>,
  onFn: DataPieceFn<R, InstanceType<T>>,
): OnDataPiece<R, InstanceType<T>> {
  return [(input) => input instanceof UseClass, onFn];
}

export function getCustomClassPiece<
  R,
  T extends DataClassClassType<typeof DataClass>,
>(...args: Parameters<typeof makeClassPiece<R, T>>) {
  // compare the class used and the
  if (args[0] === DataClass) {
    console.warn(
      "This function is meant to create custom option pieces for classes derived from DataClass, but you used DataClass. Either a bug in the check or this logic should be in the option `onDataClass`",
    );
  }
  return makeClassPiece(...args);
}

function optionsToPieces<R>({
  onCustom = [],
  onDataClass = false,
  onPrimatives: onPrimativesFn = (input) => input as R,
  onArray: onArrayFn = onArray,
  onSet: onSetFn = onSet,
  onMap: onMapFn = onMap,
  onObj: onObjFn = onRecord,
}: RecursivePiecesOptions<R>): OnDataPiece<R, any>[] {
  return [
    ...onCustom,
    onDataClass && makeClassPiece(DataClass, onDataClass),
    onPrimativesFn && [isDataTypePrimative, (input: DataType) => input as R],
    onArrayFn && [(input: DataType) => Array.isArray(input), onArrayFn],
    onSetFn && [(input: DataType) => input instanceof Set, onSetFn],
    onMapFn && [(input: DataType) => input instanceof Map, onMapFn],
    onObjFn && [isDataTypeRecord, onObjFn],
  ].filter<OnDataPiece<R>>((val): val is OnDataPiece<R> => !!val);
}

export function createRecursive<R>(
  options: RecursivePiecesOptions<R>,
): OnDataFn<R> {
  const allPieces = optionsToPieces<R>(options);
  function onData(input: DataType): R {
    for (const [isType, onType] of allPieces) {
      if (isType(input)) {
        return onType(input, onData);
      }
    }
    console.error("value that missed type checks: ", input);
    throw new Error(
      "Missed some type in type checking while running recursive function",
    );
  }
  return onData;
}
