/* eslint-disable @typescript-eslint/prefer-function-type */
/* eslint-disable @typescript-eslint/no-explicit-any */
import type { GameRoomDataI } from "./room";

// Updater Functions will (potentially) update the game room, returning the next piece of data to use and a boolean flag if it made changes;
// the response type: the RoomData to use, and a boolean if there have been changes made
export type UpdaterResponse = [GameRoomDataI, boolean];

// Base definition for an updater function, that takes the room and returns the response type
// will allow undefined/void response to indicate (no changes were made) and avoid needing to add that to the end of a function
export type UpdaterDef<T extends any[] = any[]> = (
  room: GameRoomDataI,
  ...args: T
) => UpdaterResponse | undefined;

// Inner function we create for the Updater
export type UpdaterInner<T extends any[] = any[]> = (
  current: UpdaterResponse,
  ...args: T
) => UpdaterResponse;
// Usable UpdaterFn we create with a utility, will allow for a response object input and merge them as needed
export type UpdaterFn<T extends any[] = any[]> = (
  current: GameRoomDataI | UpdaterResponse,
  ...args: T
) => UpdaterResponse;

// export interface UpdaterFn<T extends any[]> {
//   (current: GameRoomDataI | UpdaterResponse, ...args: T): UpdaterResponse;
// }

export interface Updater<T extends any[] = any[]> extends UpdaterFn<T> {
  inner: UpdaterInner<T>;
}

// export type Updater<T extends any[]> = UpdaterFn<T> & {inner: UpdaterInner<T>};
