import type { Updater } from "./updater_types";
import { getInputResponse } from "./updater";

import { cloneDeep } from "lodash";

// wrapper to verify that the call preserves the readonly aspect of the input room
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function makeUpdaterCall<T extends any[]>(
  updater: Updater<T>,
  ...args: Parameters<Updater<T>>
): ReturnType<Updater<T>> {
  // we need to know the inputRoom and if it's flagged as with changes already to know what to expect after
  const [inputRoom, inputHasChanged] = getInputResponse(args[0]);

  const inputCopy = cloneDeep(inputRoom);
  /**
   * const inputCopy = structuredClone(inputRoom);
   * NOTE: tried using structuredClone which should have worked? but got this error and couldn't figure it out
   * TypeError: Method Set.prototype.values called on incompatible receiver #<Set>
   */
  // should be a new object reference
  expect(inputCopy).not.toBe(inputRoom);
  // verify the copy was made correctly for deep equality
  expect(inputCopy).toEqual(inputRoom);

  const response = updater(...args);

  // always confirm that input wasn't modified, regardless of change
  expect(inputRoom).toEqual(inputCopy);

  const [afterRoom, afterChange] = response;

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
      expect(afterRoom).not.toBe(inputRoom);
      expect(afterRoom).not.toEqual(inputRoom);
    } else {
      // if no change, expect the returned room to be a reference to the inputRoom
      expect(afterRoom).toBe(inputRoom);
      // verify it didn't change the room but keep reference
      expect(afterRoom).toEqual(inputCopy);
    }
  } else {
    // if the input already had it flagged as truthy, than the response should always keep that truthyness
    expect(afterChange).toBeTruthy();
    // we can't make any assumptions about the room at this point.
  }

  return response;
}
