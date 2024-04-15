/* eslint-disable @typescript-eslint/no-explicit-any */
import { type Primatives, isPrimative, isRecord } from "./assertions";

// function type to check if the input is the type we want to process in DataPieceFn
type IsDataPiece<T> = (input: any) => input is T;
// the base function type for the recursive function structure
type OnDataFn<In, Out> = (input: In) => Out;
type RootFnType<Out> = OnDataFn<any, Out>;

// what is used to process a piece of the data
// NOTE: could potentially add other args for helpers if they are needed
type DataPieceFn<In, Out> = (input: In, onData: OnDataFn<any, Out>) => Out;

type OnDataPiece<In, Out> = [
  isPiece: IsDataPiece<In>,
  onPiece: DataPieceFn<In, Out>,
];

function onArray<Out>(input: any[], fn: RootFnType<Out>): Out {
  return input.map(fn) as Out;
}
function onSet<Out>(input: Set<any>, fn: RootFnType<Out>): Out {
  return new Set(fn(Array.from(input)) as Out[]) as Out;
}
function onMap<Out>(input: Map<unknown, any>, fn: RootFnType<Out>): Out {
  const entries = Array.from(input);
  const newEntires = entries.map<[unknown, Out]>(([key, value]) => [
    key,
    fn(value),
  ]);
  return new Map(newEntires) as Out;
}
function onRecord<Out>(input: Record<string, any>, fn: RootFnType<Out>): Out {
  return Object.keys(input).reduce(
    (output, key) => {
      output[key] = fn(input[key]);
      return output;
    },
    {} as Record<string, Out>,
  ) as Out;
}

// input options for recursive function. Allowing for adding custom types, and for overriding/disabling default values
interface RecursivePiecesOptions<Out> {
  // for passing in custom checkers
  onCustom?: OnDataPiece<any, Out>[];
  /**
   * Optional types: These have default functions to use
   * Primatives are sort of a special case, the default is to return the input as is. I'm sure there are fancy type checkings we can do for this but they wouldn't work at runtime?
   */
  onPrimatives?: false | DataPieceFn<Primatives, Out>;
  onArray?: false | DataPieceFn<any[], Out>;
  onSet?: false | DataPieceFn<Set<any>, Out>;
  onMap?: false | DataPieceFn<Map<unknown, any>, Out>;
  onObj?: false | DataPieceFn<Record<string, any>, Out>;
  onCatch?: false | OnDataPiece<any, Out> | DataPieceFn<any, Out>;
}

type BaseClassType = abstract new (...args: any) => any;
type ClassType<T> = T extends abstract new (...args: any) => any ? T : never;
// function split so that we can use it in optionsToPieces without the warning
export function getCustomClassPiece<T extends BaseClassType, Out>(
  UseClass: ClassType<T>,
  onFn: DataPieceFn<InstanceType<T>, Out>,
): OnDataPiece<InstanceType<T>, Out> {
  return [(input): input is InstanceType<T> => input instanceof UseClass, onFn];
}

function optionsToPieces<Out>({
  onCustom = [],
  onPrimatives: onPrimativesFn = (input) => input as Out,
  onArray: onArrayFn = onArray<Out>,
  onSet: onSetFn = onSet<Out>,
  onMap: onMapFn = onMap<Out>,
  onObj: onObjFn = onRecord<Out>,
  onCatch,
}: RecursivePiecesOptions<Out>): OnDataPiece<any, Out>[] {
  return [
    ...onCustom,
    onPrimativesFn && [isPrimative, onPrimativesFn],
    onArrayFn && [
      (input: any): input is Array<any> => Array.isArray(input),
      onArrayFn,
    ],
    onSetFn && [
      (input: any): input is Set<any> => input instanceof Set,
      onSetFn,
    ],
    onMapFn && [
      (input: any): input is Map<unknown, any> => input instanceof Map,
      onMapFn,
    ],
    onObjFn && [isRecord, onObjFn],
    // last add the "onCatch catchAll function"
    onCatch &&
      (typeof onCatch === "function"
        ? [(input: any): input is any => true, onCatch]
        : onCatch),
  ].filter<OnDataPiece<any, Out>>((val): val is OnDataPiece<any, Out> => !!val);
}

export function createRecursive<In, Out>(
  options: RecursivePiecesOptions<Out>,
): OnDataFn<In, Out> {
  const allPieces = optionsToPieces<Out>(options);
  function onData(input: In): Out {
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
