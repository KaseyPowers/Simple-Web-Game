/* eslint-disable @typescript-eslint/no-explicit-any */
import type { GameRoomDataI } from "./room";
import type {
  GameRoomEventDef,
  OnGameRoomEvent,
  OnEventResponse,
  OnRoomStoreEvent,
} from "./event_util_types";

import { utils as managerUtils } from "./room_manager";

export function createRoomEventFn<T extends any[]>(
  fn: GameRoomEventDef<T>,
): OnGameRoomEvent<T> {
  return (
    current: GameRoomDataI | OnEventResponse,
    ...args: T
  ): OnEventResponse => {
    // this spread lets us take in a response or just the room. That way this generated fn can be optionally chained
    const [room, currentChanged]: OnEventResponse = Array.isArray(current)
      ? current
      : [current, false];
    const [nextRoom, nextChanged] = fn(room, ...args);
    // the final results will always be the latest room returned
    // but if this fn didn't change the room, we still want to keep a truthy value from currentChanged
    return [nextRoom, nextChanged || currentChanged];
  };
}

export function createStoreEventFn<T extends any[]>(
  fn: OnGameRoomEvent<T>,
): OnRoomStoreEvent<T> {
  return (inputRoom, ...args): OnEventResponse => {
    const room = managerUtils.getRoomValidated(inputRoom);
    return fn(room, ...args);
  };
}
