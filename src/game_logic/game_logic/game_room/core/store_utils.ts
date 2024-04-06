import cryptoRandomString from "crypto-random-string";

import { type GameRoomDataI, newGameRoomData } from "../core/room";

import { allGameRooms } from "../../shared_store";

/**
 * The basic store functions
 */
// grab room from store
export function getRoomById(roomId: string) {
  return allGameRooms[roomId];
}
// NOTE: Need to make sure updaterFns are all tested to verify roomId can't change.
// assign room to store, using the roomId from room is used.
export function setRoom(room: GameRoomDataI) {
  allGameRooms[room.roomId] = room;
}
export function removeRoom(input: RoomOrId) {
  const roomId = inputRoomId(input);

  // debugger info TODO: add a toggle/env check to turn off
  const room = getRoomById(roomId);
  if (!room) {
    console.warn(
      `Attempting to remove room ${roomId} but it isn't found in the store`,
    );
  }

  delete allGameRooms[roomId];
}

export function addNewRoom() {
  // creating a roomId first, then validate it before creating and adding the room to store
  // NOTE: using library to make a shorter id that will be easier to type manually into a browser if that's how it's being shared.
  const roomId = cryptoRandomString({ length: 6, type: "distinguishable" });
  if (getRoomById(roomId)) {
    throw new Error(
      `Somehow created a room for an id that already exists! roomId: ${roomId}`,
    );
  }
  const newRoom = newGameRoomData(roomId);
  // set can update an existing room and add a new room to the store
  setRoom(newRoom);
  return newRoom;
}

/**
 * Functions for taking in the input type RoomOrId and using and/or validating it with the store
 */
export type RoomOrId = string | GameRoomDataI;
/**
 * - Not validated
 * @param input: GameRoom or a roomId,
 * @returns roomId: will return a given roomId, otherwise grab id from the gameRoom provided (without store validation)
 */
export function inputRoomId(input: RoomOrId): string {
  return typeof input === "string" ? input : input.roomId;
}

/**
 * - Not Validated
 * @param input: GameRoom or roomId string
 * @returns gameRoom: if a string, try grabbing the current store value, if input is a room, keep using it
 */
export function inputRoom(input: RoomOrId) {
  // tries to find the room if input is a string (assumed roomId). Otherwise keep the room obj
  return typeof input === "string" ? getRoomById(input) : input;
}

// will get the room instance from the store even if a gameRoom obj passed in that doesn't match the store's current value
export function inputStoreRoom(input: RoomOrId) {
  // just get the id from input, and try getting store value using that
  return getRoomById(inputRoomId(input));
}

/**
 * - Validated
 * Returns the room, throwing an error if input string didn't find a room, or if the passed in gameRoom's id isn't found
 * @param input
 * @returns gameRoom: the room found in store for an input roomId, will return the passed in input room if provided
 */
export function getRoom(input: RoomOrId): GameRoomDataI {
  // logic is different here so that error message is context aware
  if (typeof input === "string") {
    // can use the
    const room = getRoomById(input);
    if (!room) {
      throw new Error(`No room was found for ${input}`);
    }
    return room;
  }
  // input is a room, validate that it's in the store
  if (!inputStoreRoom(input)) {
    throw new Error(
      `Validating input room, but room's id (${input.roomId}) was not found in the store`,
    );
  }
  return input;
}
