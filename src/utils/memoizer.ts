/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */

// will take a fn type, if it only uses one param, return that type, otherwise return the full array.
// type SimplifiedParameters<Fn extends FnBaseType> =
//   Parameters<Fn> extends [infer First, ...infer Rest]
//     ? Rest extends []
//       ? First
//       : Parameters<Fn>
//     : never;

type FnBaseType = (...args: any) => any;

type CompareArgsFn<Fn extends FnBaseType> = (
  previousArgs: Parameters<Fn>,
  nextArgs: Parameters<Fn>,
) => boolean;

// the object for storing other aspects of memoized fn
interface MemoizedFnObj<Fn extends FnBaseType> {
  argsDidChange: CompareArgsFn<Fn>;
  wrappedFn: Fn;
  /** Where we store the previous input/output (could allow customizing more stuff later?) */
  results?: [Parameters<Fn>, ReturnType<Fn>];
}

type MemoizedFn<Fn extends FnBaseType> = (
  this: MemoizedFnObj<Fn>,
  ...args: Parameters<Fn>
) => ReturnType<Fn>;

export type Memoized<Fn extends FnBaseType> = MemoizedFn<Fn> &
  MemoizedFnObj<Fn>;

export interface MemoizerOptions<Fn extends FnBaseType> {
  /** 2 functions available, in case it's easier to define equality and reverse it */
  argsDidChange?: CompareArgsFn<Fn>;
  argsEqual?: CompareArgsFn<Fn>;
  // if we want a first value to be defined already
  initialParams?: Parameters<Fn>;
  // if we want to define an initial value without running the function at creation
  initialResults?: [Parameters<Fn>, ReturnType<Fn>];
  /** options specific to copying an already memoized fn */
  // if the above options would replace any existing options
  overrideCopy?: boolean;
  // if copying a function that has a previousState set, if it should be reset (only used if override copy is false)
  resetPreviousState?: boolean;
}

export function isMemoized<Fn extends FnBaseType>(
  value: Fn | Memoized<Fn>,
): value is Memoized<Fn> {
  return "wrappedFn" in value;
}

// simple memoization function, just saving the last input/output and comparing it. Could allow for deeper memoization later or as an option
export function memoize<Fn extends FnBaseType>(
  inputFn: Fn | Memoized<Fn>,
  options: MemoizerOptions<Fn> = {},
) {
  if (typeof inputFn !== "function") {
    throw new Error("Must pass in a function");
  }
  let outputObj: MemoizedFnObj<Fn>;
  let outputFn: MemoizedFn<Fn>;
  let initialParams: undefined | Parameters<Fn> = undefined;

  if (isMemoized(inputFn)) {
    outputFn = inputFn;
    outputObj = { ...inputFn };
    const { overrideCopy = false, resetPreviousState = true } = options;
    // if overrideCopy, apply it over the previous values (only the defined options)
    if (overrideCopy) {
      const { argsDidChange, argsEqual } = options;
      let didChange = argsDidChange;
      if (!didChange && argsEqual) {
        didChange = (...args) => !argsEqual(...args);
      }

      if (didChange) {
        outputObj.argsDidChange = didChange;
      }

      if (options.initialResults) {
        outputObj.results = options.initialResults;
      } else if ("initialParams" in options) {
        initialParams = options.initialParams;
      }
    }
    // reset the results when making a copy, will skip if overrideCopy assigned a new state already
    if (resetPreviousState && !(overrideCopy && options.initialResults)) {
      // deleting previous state or should reset check for a state defined in options?
      delete outputObj.results;
    }
  } else {
    const { argsDidChange, argsEqual } = options;
    let didChange = argsDidChange;
    if (!didChange && argsEqual) {
      didChange = (...args) => !argsEqual(...args);
    }
    if (!didChange) {
      didChange = (previousArgs, nextArgs) =>
        previousArgs === nextArgs ||
        (previousArgs.length === nextArgs.length &&
          previousArgs.every((val, index) => val === nextArgs[index]));
    }
    outputObj = {
      wrappedFn: inputFn,
      argsDidChange: didChange,
    };

    if (options.initialResults) {
      outputObj.results = options.initialResults;
    } else if ("initialParams" in options) {
      initialParams = options.initialParams;
    }

    outputFn = function (...args) {
      // check for changes and run the wrapped function as needed
      if (!this.results || this.argsDidChange(this.results[0], args)) {
        const nextResponse: ReturnType<Fn> = this.wrappedFn(...args);
        this.results = [args, nextResponse];
      }
      return this.results[1];
    };
  }
  // if initialParams are used, pre-set the results value for the object
  if (initialParams) {
    outputObj.results = [initialParams, outputObj.wrappedFn(initialParams)];
  }

  return Object.assign(outputFn.bind(outputObj), outputObj);
}
