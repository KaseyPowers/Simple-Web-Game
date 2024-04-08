import { jest } from "@jest/globals";
import type {
  Updater,
  UpdaterResponse,
  GetUpdaterParameters,
} from "./updater_types";

import { cloneDeep } from "lodash";
import { updaterFromObj, getCommonUpdaterObj } from "./updater";

/* eslint-disable @typescript-eslint/no-explicit-any */
export type MockedUpdater<
  U extends Updater<any, any[], any> = Updater<any, any, any>,
> = Omit<U, "inputParser" | "coreInnerFn"> & {
  inputParser: jest.Mocked<U["inputParser"]>;
  coreInnerFn: jest.Mocked<U["coreInnerFn"]>;
};
/* eslint-enable@typescript-eslint/no-explicit-any */

export function makeTestUpdater<
  U extends Updater<any, any[], any>,
>(): MockedUpdater<U> {
  return updaterFromObj({
    inputParser: jest.fn<U["inputParser"]>() as unknown as U["inputParser"],
    onChangeFns: [],
    coreInnerFn: jest.fn<U["coreInnerFn"]>() as unknown as U["coreInnerFn"],
    ...getCommonUpdaterObj(),
  }) as U & {
    inputParser: jest.Mocked<U["inputParser"]>;
    coreInnerFn: jest.Mocked<U["coreInnerFn"]>;
  };
}

// wrapper to verify that the call preserves the readonly aspect of the input room
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function makeUpdaterCall<Type, T extends Updater<Type> = Updater<Type>>(
  updater: T,
  ...args: GetUpdaterParameters<T>
): UpdaterResponse<Type> {
  // const [input, ...argsRest] = args;
  // get the initial value that the updaters parser will give us.
  // we rely on the parser to work as expected for these
  const [inputVal, inputHasChanged] = updater.inputParser(args[0]);
  // deep copy of the input value
  const inputCopy = cloneDeep(inputVal);
  /**
   * const inputCopy = structuredClone(inputRoom);
   * NOTE: tried using structuredClone which should have worked? but got this error and couldn't figure it out
   * TypeError: Method Set.prototype.values called on incompatible receiver #<Set>
   */

  // should be a new object reference
  expect(inputCopy).not.toBe(inputVal);
  // verify the copy was made correctly for deep equality
  expect(inputCopy).toEqual(inputVal);

  const response = updater(...args);

  // always confirm that input wasn't modified, regardless of change
  expect(inputVal).toEqual(inputCopy);

  const [afterVal, afterChange] = response;

  /**
   * Test scenarios:
   * - inputHasChanged: F
   * this is best case and probably common, we know whatever is returned is what the updater did. (didChange = afterChange)
   * - inputHasChanged: T
   * in this case, afterChange F is invalid, and afterChagne T just means we don't know if it made a change
   */
  if (!inputHasChanged) {
    if (afterChange) {
      // if changed, make sure newRoom is not equal or a reference to inputRoom
      expect(afterVal).not.toBe(inputVal);
      expect(afterVal).not.toEqual(inputVal);
    } else {
      // if no change, expect the returned room to be a reference to the inputRoom
      expect(afterVal).toBe(inputVal);
      // verify it didn't change the room but keep reference
      expect(afterVal).toEqual(inputCopy);
    }
  } else {
    // if the input already had it flagged as truthy, than the response should always keep that truthyness
    expect(afterChange).toBeTruthy();
    // we can't make any assumptions about the room at this point.
  }

  return response;
}
