/* eslint-disable @typescript-eslint/no-explicit-any */
import type { GameRoomDataI } from "../core/room";
import type {
  Updater,
  UpdaterInner,
  UpdaterResponse,
  GetUpdaterArgs,
} from "../core/updater_types";
import { type RoomOrId, getRoom, setRoom } from "./utils";

type StoreUpdaterInput = RoomOrId | UpdaterResponse;

type StoreUpdaterFn<T extends any[] = any[]> = (
  input: StoreUpdaterInput,
  ...args: T
) => UpdaterResponse;

interface StoreUpdaterInners<T extends any[] = any[]> {
  inner: UpdaterInner<T>;
  innerNoUpdate: UpdaterInner<T>;
}

export interface StoreUpdater<T extends any[] = any[]>
  extends StoreUpdaterFn<T>,
    StoreUpdaterInners<T> {
  noUpdate: StoreUpdaterFn<T>;
}

type StoreUpdaterArgs<Type extends StoreUpdater> =
  Type extends StoreUpdater<infer T> ? T : never;

type ConvertUpdaterType<Type extends Updater> = StoreUpdater<
  GetUpdaterArgs<Type>
>;

export type MapConvertUpdate<Type extends Record<string, Updater>> = {
  [Property in keyof Type]: ConvertUpdaterType<Type[Property]>;
};

// parse + validate the input type to an response to use
export function getInputUpdate(input: StoreUpdaterInput): UpdaterResponse {
  let output: UpdaterResponse;
  // splitting up logic from ternary for validation
  if (Array.isArray(input)) {
    output = input;
    // validate the room, curerntly don't care about the returned object
    getRoom(output[0]);
  } else {
    output = [getRoom(input), false];
  }
  return output;
}

/**
 * Thoughts:
 * Originally was going to try to minimize how often the store data get's chagned
 * but since I'm not using an immutable library to wrap that logic right now, I don't see it adding too much overhead.
 * So Instead of trying to wrap+add the update as late as possible,
 * I'm thinking this will just make a copy of all core updaters wrapped with the logic to update the room.
 *
 * NOTE:
 * if it becomes necessary, or if we want to get fancier, when we get a roomObj in the input, we could compare it to the store value we get from validation and do something with that and the onChange value
 *
 * NOTE2:
 * Switched this pattern to one using generic infering types to get the mapping function to play nicely.
 * I don't feel like it's as readable but there were issues with converting between the generic based types (for mapping) and using <T extends any[]> like in the original updater utilities.
 */
function createStoreUpdaterFromInners<T extends any[]>(
  innerFunctions: StoreUpdaterInners<T>,
): StoreUpdater<T> {
  const useFn: StoreUpdaterFn<T> = (input, ...args) => {
    const inputUpdate = getInputUpdate(input);
    return innerFunctions.inner(inputUpdate, ...args);
  };
  const noUpdate: StoreUpdaterFn<T> = (input, ...args) => {
    const inputUpdate = getInputUpdate(input);
    return innerFunctions.innerNoUpdate(inputUpdate, ...args);
  };
  return Object.assign(
    {},
    useFn,
    {
      noUpdate,
    },
    innerFunctions,
  );
}

function createStoreUpdater<Type extends Updater>(
  updater: Type,
): ConvertUpdaterType<Type> {
  const storeInnerFn: UpdaterInner<GetUpdaterArgs<Type>> = (
    currentUpdate,
    ...args
  ) => {
    // const [currentRoom, currentChanged] = currentUpdate;
    /**
     * NOTE:
     * this will update the store every time if the inputed update has change value to true.
     * TBD if we want to adjust that behavior.
     * Ex. could always pass false then re-combine the booleans in the return so we can check just the updater.inner for changes.
     *
     */
    const response = updater.inner(currentUpdate, ...args);
    // destructuring for readability of check/update
    const [nextRoom, nextChanged] = response;
    if (nextChanged) {
      setRoom(nextRoom);
    }
    return response;
  };
  return createStoreUpdaterFromInners<GetUpdaterArgs<Type>>({
    inner: storeInnerFn,
    innerNoUpdate: updater.inner,
  });
}

type RoomChangedFn = (room: GameRoomDataI) => void;
export function wrapStoreUpdater<Type extends StoreUpdater>(
  updater: Type,
  onChange: RoomChangedFn,
): StoreUpdater<StoreUpdaterArgs<Type>> {
  function wrapInnerFn(
    innerFn: UpdaterInner<StoreUpdaterArgs<Type>>,
  ): UpdaterInner<StoreUpdaterArgs<Type>> {
    return (currentUpdate, ...args) => {
      const response = innerFn(currentUpdate, ...args);
      const [nextRoom, nextChanged] = response;
      if (nextChanged) {
        onChange(nextRoom);
      }
      return response;
    };
  }
  return createStoreUpdaterFromInners<StoreUpdaterArgs<Type>>({
    inner: wrapInnerFn(updater.inner),
    innerNoUpdate: wrapInnerFn(updater.innerNoUpdate),
  });
}

export function mapToStoreUpdaters<Type extends Record<string, Updater>>(
  updaters: Type,
) {
  return (Object.keys(updaters) as (keyof Type)[]).reduce((output, key) => {
    const updater = updaters[key];
    if (updater) {
      output[key] = createStoreUpdater(updater);
    }
    return output;
  }, {} as MapConvertUpdate<Type>);
}
