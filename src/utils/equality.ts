/* eslint-disable @typescript-eslint/no-explicit-any */

// simple equality, only checking shallow values being equal
// export function arrayEqual<T>(a: T[], b: T[]): boolean {
//   return (
//     a === b ||
//     (a.length === b.length && a.every((val, index) => val === b[index]))
//   );
// }

// interface EqualityCheckFn {
//   <A>(a: A, b: unknown): b is A;
//   <A, B extends A = A>(a: A, b: B): boolean;
//   <T>(a: T, b: T): boolean;
// }
type IsTypeFn<T> = (input: unknown) => input is T;

type OnTypeBaseFn<T = any, R = any, OtherArgs extends any[] = []> = (...args: [input: T, ...OtherArgs]) => R;
type OnTypeInnerFn<T = any, R = any, OtherArgs extends any[] = []> = (...args: [input: T, ...OtherArgs, onNext: OnTypeBaseFn<any, R, any[]>]) => R;

interface OnTypeDef<T = any, R = any, OtherArgs extends any[] = []> {
  isType: IsTypeFn<T>,
  // optional fn to be more specific than isType for checking rest of the args
  shouldRun?: (input: T, ...args: OtherArgs)=> boolean
  run: OnTypeInnerFn<T , R , OtherArgs>
}

interface OnTypeDefault<R = any, OtherArgs extends any[] = []> {
  shouldRun?: (input: any, ...args: OtherArgs) => boolean,
  run: OnTypeBaseFn<any, R, OtherArgs>;
}

type DeafultOnTypeInput<R, OtherArgs extends any[] = []> = OnTypeBaseFn<any, R, OtherArgs> | OnTypeDefault<R, OtherArgs>;

function createRecursive<R, OtherArgs extends any[] = []>(typeDefs: OnTypeDef<any, R, OtherArgs>[], defaultTypeInput: DeafultOnTypeInput<R, OtherArgs>) {
  const defaultTypeObj: OnTypeDefault<R, OtherArgs> = ("run" in defaultTypeInput ? defaultTypeInput : {run: defaultTypeInput});
  
  function onData(val: unknown, ...args: OtherArgs) {
    for (const def of typeDefs) {
      if (def.isType(val) && (!def.shouldRun || def.shouldRun(val, ...args))) {
        return def.run(val, ...args, onData);
      }
    }
    if (!defaultTypeObj.shouldRun || defaultTypeObj.shouldRun(val, ...args)) {
      return defaultTypeObj.run(val, ...args);
    }
    console.error("value that missed type checks: ", val);
    throw new Error("data was called with a type that wasn't covered by type definitions");
  }
  return onData;
}

/** Equality stuff for recursive */
type EqualityOnTypeDef<T> = OnTypeDef<T, boolean, [second: T]>;
type EqualityOnTypeDefaultSet = OnTypeDefault<boolean, [second: any]>;

const defaultEqualityDefault: EqualityOnTypeDefaultSet = {
  run: Object.is
};

const arrayEqaulitySet: EqualityOnTypeDef<any[]> = {
  isType: Array.isArray,
  shouldRun(a, b: unknown) {
    return this.isType(a) && this.isType(b);
  },
  run(a, b, onNext) {
    return a === b || (a.length === b.length &&
      a.every((val, index) =>
        onNext(val, b[index]),
      ));
  }
}

function getEqualitySet<Def extends EqualityOnTypeDef<unknown>>(def: Def): Def {
  return {
    shouldRun(a: unknown, b: unknown) {
      return this.isType(a) && this.isType(b);
    },
    ...def
  };
}

function createRecursiveEquality(typeDefs: EqualityOnTypeDef<any>[], defaultDefaultTypeInput: EqualityOnTypeDefaultSet = defaultEqualityDefault) {
  const checkedDefs = typeDefs.map(def  => getEqualitySet(def));
  return (defaultTypeInput: EqualityOnTypeDefaultSet = defaultDefaultTypeInput) => {
    
  }
}

export const isArrayEqual = createRecursive<boolean, [second: any]>([arrayEqaulitySet], defaultEqualityDefault)


type EqualityCheckFn<T> = (a: T, b: T) => boolean;

export function arrayEqual<T extends any[]>(
  a: T,
  b: T,
  comparitor: EqualityCheckFn<T[number]> = Object.is,
): boolean {
  // strict check first variable
  if (!Array.isArray(a)) {
    throw new Error("expected first value to be an array");
  }
  return (
    Array.isArray(b) &&
    (a === b ||
      (a.length === b.length &&
        a.every((val: T[number], index) =>
          comparitor(val, b[index] as T[number]),
        )))
  );
}



type RecursiveFn<Type = any, Response = any> = (input: Type,  )