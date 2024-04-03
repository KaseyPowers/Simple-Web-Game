/* eslint-disable @typescript-eslint/no-explicit-any */
import type {
  UpdaterDef,
  UpdaterInner,
  UpdaterFn,
  UpdaterResponse,
  Updater,
} from "./util_types";

export function createUpdater<T extends any[]>(fn: UpdaterDef<T>): Updater<T> {
  const innerFn: UpdaterInner<T> = (currentUpdate, ...args) => {
    const [currentRoom, currentChanged] = currentUpdate;
    const updateResponse = fn(currentRoom, ...args);
    // if didn't return, treat it as no-changes and return current values
    if (!updateResponse) {
      return currentUpdate;
    }
    const [nextRoom, nextChanged] = updateResponse;
    return [nextRoom, nextChanged || currentChanged];
  };

  const useFn: UpdaterFn<T> = (input, ...args) => {
    const inputUpdate: UpdaterResponse = Array.isArray(input)
      ? input
      : [input, false];
    return innerFn(inputUpdate, ...args);
  };
  // add innerFn to the output so it can be referenced
  return Object.assign({}, useFn, {
    inner: innerFn,
  });
}
