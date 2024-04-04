/* eslint-disable @typescript-eslint/no-explicit-any */
import type {
  UpdaterDef,
  UpdaterInner,
  UpdaterFn,
  UpdaterResponse,
  Updater,
  UpdaterFnInput,
} from "./updater_types";

// split this fn out to help with testing, but doesn't need to be defined in the createUpdater logic
export function getInputResponse(input: UpdaterFnInput): UpdaterResponse {
  return Array.isArray(input) ? input : [input, false];
}

export function createUpdater<T extends any[]>(fn: UpdaterDef<T>): Updater<T> {
  const innerFn: UpdaterInner<T> = (currentUpdate, ...args) => {
    const [currentRoom, currentChanged] = currentUpdate;
    const updateResponse = fn(currentRoom, ...args);
    // if didn't return, treat it as no-changes and return current values
    if (!updateResponse) {
      return currentUpdate;
    }
    const [nextRoom, nextChanged] = updateResponse;
    // validate that if no changes reported, the room returned didn't change either
    // could verify the other direction too, but would need to do deep equality check
    if (!nextChanged && currentRoom !== nextRoom) {
      throw new Error(
        "function returned that no changes occured but returned a new room",
      );
    }
    return [nextRoom, nextChanged || currentChanged];
  };

  const useFn: UpdaterFn<T> = (input, ...args) => {
    const inputUpdate = getInputResponse(input);
    return innerFn(inputUpdate, ...args);
  };
  // add innerFn to the output so it can be referenced
  return Object.assign(useFn, {
    inner: innerFn,
  });
}
