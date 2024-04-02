/* eslint-disable @typescript-eslint/no-explicit-any */
import type { GameRoomDataI } from "./room";
import type {
  GameRoomEventDef,
  OnGameRoomEvent,
  OnEventResponse,
} from "./event_util_types";

import { updateRoom } from "./room_manager";

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

type RoomFnType = (room: GameRoomDataI) => void;
type inputRoomFnType = RoomFnType | RoomFnType[];
function getChangeFunctions(
  input?: inputRoomFnType,
  withUpdate = true,
): RoomFnType[] {
  let output: RoomFnType[] = [];

  if (input) {
    output = Array.isArray(input) ? input : [input];
  }
  // add updateFn to the list if withupdate flag defined
  if (withUpdate && !output.includes(updateRoom)) {
    output = [updateRoom, ...output];
  }
  return output;
}
// inner core logic for wrapGameRoomEvent
function _wrapGameRoomEvent<T extends any[]>(
  fn: OnGameRoomEvent<T>,
  onChangeFunctions: RoomFnType[],
): OnGameRoomEvent<T> {
  return (...args: Parameters<typeof fn>) => {
    const response = fn(...args);
    const [room, onChange] = response;
    if (onChange) {
      // iterate over array and call each function
      onChangeFunctions.forEach((changeFn) => changeFn(room));
    }
    // return the response just in case
    return response;
  };
}
// default behavior
export function wrapGameRoomEvent(
  fn: OnGameRoomEvent,
  onChangeFn?: inputRoomFnType,
): OnGameRoomEvent {
  const onChangeFunctions = getChangeFunctions(onChangeFn);
  return _wrapGameRoomEvent(fn, onChangeFunctions);
}
export function wrapGameRoomEventNoUpdate(
  fn: OnGameRoomEvent,
  onChangeFn?: inputRoomFnType,
): OnGameRoomEvent {
  const onChangeFunctions = getChangeFunctions(onChangeFn, false);
  return _wrapGameRoomEvent(fn, onChangeFunctions);
}
