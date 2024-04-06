/* eslint-disable @typescript-eslint/no-explicit-any */

import type {
  UpdaterResponse,
  UpdaterDef,
  UpdateBuilderObj,
  UpdaterObj,
  Updater,
  UpdateBuilderOptions,
  UpdaterFnInput,
  MapToNewUpdater,
  GetUpdaterArgs,
  ConvertUpdaterType,
} from "./updater_types";

/**
 * Attempted to use the BasicInputParserType to prevent array types from being allowed.
 * This didn't seem to work though,
 * I'm leaving the type, test, and function def with the extend I was using though, in case someone else can figure it out or I understand it better later
 */

// // we don't want to accept arrays for the simple inputparser
// // technically we could accept arrays that are not overlapping the response object but would get more complicated to check for so ignoring for now
// type BasicInputParserType<Type> = Type extends Array<any> ? never : Type;
// // to test the typing that stops array
// const arrInputParser = basicInputParser<string[]>;
// export function basicInputParser<Type extends BasicInputParserType<any>>(
export function basicInputParser<Type>(
  input: UpdaterFnInput<Type, undefined>,
): UpdaterResponse<Type> {
  return Array.isArray(input) ? input : [input, false];
}

export function getBuilderObj<Type, OtherInputs = undefined>(
  options?: UpdateBuilderOptions<Type, OtherInputs>,
): UpdateBuilderObj<Type, OtherInputs> {
  // types here got too complext it seems, so just casting for now
  const output = {
    inputParser: basicInputParser,
    onChangeFns: [],
    ...(options ?? {}),
  } as UpdateBuilderObj<Type, OtherInputs>;

  if (output.onChangeFns.some((changeFn) => typeof changeFn !== "function")) {
    throw new Error(
      `Invalid onChangeFns defined in object: [${output.onChangeFns.map((part) => typeof part).join(", ")}]`,
    );
  }

  return output;
}

function updaterFromObj<
  Type = any,
  Args extends any[] = any[],
  OtherInputs = undefined,
>(
  updaterObj: UpdaterObj<Type, Args, OtherInputs>,
): Updater<Type, Args, OtherInputs> {
  return Object.assign(updaterObj.update.bind(updaterObj), updaterObj);
}
// get the final updater with the builder obj input
export function getUpdaterFromBuilder<
  Type = any,
  Args extends any[] = any[],
  OtherInputs = undefined,
>(
  updaterFn: UpdaterDef<Type, Args>,
  builder: UpdateBuilderObj<Type, OtherInputs>,
): Updater<Type, Args, OtherInputs> {
  const { onChangeFns, inputParser } = builder;
  const outputObj: UpdaterObj<Type, Args, OtherInputs> = {
    inputParser: inputParser,
    // make sure to make a copy of the change functions in case the builder is shared
    onChangeFns: [...onChangeFns],
    coreInnerFn(currentUpdate, ...args) {
      const [currentVal, currentChanged] = currentUpdate;
      const nextUpdate = updaterFn(currentVal, ...args);
      if (!nextUpdate) {
        return currentUpdate;
      }
      const [nextVal, nextChanged] = nextUpdate;
      if (!nextChanged && currentVal !== nextVal) {
        throw new Error(
          "updater function return indicates that no changes occured but returned a new value",
        );
      }
      return [nextVal, nextChanged || currentChanged];
    },
    // wrapper for change listeners
    innerFn(inputUpdate, ...args) {
      const nextUpdate = this.coreInnerFn(inputUpdate, ...args);
      const [nextRoom, nextChanged] = nextUpdate;
      if (nextChanged) {
        this.onChangeFns.forEach((fn) => {
          fn(nextRoom);
        });
      }
      return nextUpdate;
    },
    update(input, ...args) {
      const inputUpdate = this.inputParser(input);
      return this.innerFn(inputUpdate, ...args);
    },
  };
  return updaterFromObj(outputObj);
}
// make a copy of an updater
function copyUpdaterObj<
  Type = any,
  Args extends any[] = any[],
  OtherInputs = undefined,
>(
  updater: Updater<Type, Args, OtherInputs>,
): UpdaterObj<Type, Args, OtherInputs> {
  const { onChangeFns, inputParser, coreInnerFn, innerFn, update } = updater;
  // shallow copy the changeFns but the rest are updates we can keep;
  return {
    onChangeFns: [...onChangeFns],
    inputParser,
    coreInnerFn,
    innerFn,
    update,
  };
}

export function copyUpdater<
  Type = any,
  Args extends any[] = any[],
  OtherInputs = undefined,
>(updater: Updater<Type, Args, OtherInputs>): Updater<Type, Args, OtherInputs> {
  const obj = copyUpdaterObj(updater);
  return updaterFromObj(obj);
}

// extend with a (semi)-defined builder object
export function extendUpdater<
  Type = any,
  Args extends any[] = any[],
  OtherInputs = undefined,
>(
  updater: Updater<Type, Args, any>,
  options: Partial<UpdateBuilderObj<Type, OtherInputs>>,
): Updater<Type, Args, OtherInputs> {
  const copy = copyUpdaterObj(updater);
  const { onChangeFns = [], inputParser } = options;
  const obj: UpdaterObj<Type, Args, OtherInputs> = {
    ...copy,
    inputParser: inputParser ?? copy.inputParser,
    onChangeFns: [...copy.onChangeFns, ...onChangeFns],
  };
  // } as UpdaterObj<Type, InputType, Args>; // casting here because the generic typing has already gotten away from me
  return updaterFromObj(obj);
}

// create an updater from nothing

export function createUpdater<
  Type = any,
  Args extends any[] = any[],
  OtherInputs = undefined,
>(
  updaterFn: UpdaterDef<Type, Args>,
  options?: UpdateBuilderOptions<Type, OtherInputs>,
): Updater<Type, Args, OtherInputs> {
  const builder = getBuilderObj(options);
  return getUpdaterFromBuilder<Type, Args, OtherInputs>(updaterFn, builder);
}

// making sure options works as undefined in other places, but here we kinda expect it
export function createUpdaterBuilder<Type, OtherInputs = undefined>(
  options?: UpdateBuilderOptions<Type, OtherInputs>,
) {
  const builder = getBuilderObj<Type, OtherInputs>(options);

  function innerCreateUpdater<Args extends any[] = any[]>(
    updaterFn: Parameters<
      typeof getUpdaterFromBuilder<Type, Args, OtherInputs>
    >[0],
  ) {
    return getUpdaterFromBuilder(updaterFn, builder);
  }
  function innerExtendUpdater<FromUpdater extends Updater<Type>>(
    updater: FromUpdater,
  ) {
    return extendUpdater<Type, GetUpdaterArgs<FromUpdater>, OtherInputs>(
      updater,
      builder,
    );
  }

  function mapExtendUpdaters<
    ToConvert extends Record<string, Updater<Type, any, any>>,
    KeepKeys extends keyof ToConvert = keyof ToConvert,
  >(updatersObj: ToConvert, keepKeys?: KeepKeys[]) {
    return (
      keepKeys ?? (Object.keys(updatersObj) as (keyof ToConvert)[])
    ).reduce(
      (output, key) => {
        const updater = updatersObj[key];
        if (updater) {
          // some casting here and simple record type for initial value, just to avoid headache for now
          output[key] = innerExtendUpdater(updater) as ConvertUpdaterType<
            typeof updater,
            OtherInputs
          >;
        }
        return output;
      },
      {} as MapToNewUpdater<Type, ToConvert, OtherInputs>,
    );
  }

  return {
    createUpdater: innerCreateUpdater,
    extendUpdater: innerExtendUpdater,
    mapExtendUpdaters,
  };
}
