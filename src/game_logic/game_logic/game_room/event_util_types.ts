/* eslint-disable @typescript-eslint/no-explicit-any */
import type { GameRoomDataI } from "./room";

export type RemoveFirst<T extends unknown[]> = T extends [
  infer _,
  ...infer Rest,
]
  ? [...Rest]
  : never;
export type AfterFirstParam<T extends (...args: any[]) => any> = RemoveFirst<
  Parameters<T>
>;

// the response type: the RoomData to use, and a boolean if there have been changes made
export type OnEventResponse = [GameRoomDataI, boolean];
// Event Functions will (potentially) update the game room, returning the next data to use and a boolean flag if it made changes;

// the base type for defining an event fn. Just taking in the room and returning the response
// export type GameRoomEventDef<T extends any[] = any[]> = (
//   room: GameRoomDataI,
//   ...args: T
// ) => OnEventResponse;

export type GameRoomEventDef<T extends any[] = any[]> = (
  room: GameRoomDataI,
  ...args: T
) => OnEventResponse;

// the event fn type we will use that optionally takes in the room or an event response that has been started. That way we can more easily chain event fns
export type OnGameRoomEvent<T extends any[] = any[]> = (
  current: GameRoomDataI | OnEventResponse,
  ...args: T
) => OnEventResponse;
