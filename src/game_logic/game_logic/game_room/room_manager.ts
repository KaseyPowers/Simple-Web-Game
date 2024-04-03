import cryptoRandomString from "crypto-random-string";

import { type GameRoomDataI, newGameRoomData } from "./core/room";

import { allGameRooms } from "../shared_store";

// private-ish: grab the roomId from store
function findRoomById(roomId: string): GameRoomDataI | undefined {
  return allGameRooms[roomId];
}

// final step to fully wrapped event/update functions. This will a response object and will update the store if it reports changes
export function updateRoom(room: GameRoomDataI) {
  // on changes re-assign the new room to the store
  allGameRooms[room.roomId] = room;
}

export type RoomOrId = string | GameRoomDataI;
// get the roomId from input type (assume string input is the roomId)
function getInputRoomId(input: RoomOrId): string {
  return typeof input === "string" ? input : input.roomId;
}
// get the room obj, keeping a passed in room or try fetching the string
function getInputRoom(input: RoomOrId) {
  // tries to find the room if input is a string (assumed roomId). Otherwise keep the room obj
  return typeof input === "string" ? findRoomById(input) : input;
}
// this will get the store's value of a room even if a room object is passed in
function findRoom(input: RoomOrId) {
  return findRoomById(getInputRoomId(input));
}

// NOTE: Should this return the room passed in or grab state room from `getCurrentRoom` instead?
function findRoomValidated(input: RoomOrId): GameRoomDataI {
  if (typeof input === "string") {
    // can use the
    const room = findRoomById(input);
    if (!room) {
      throw new Error(`No room was found for ${input}`);
    }
    return room;
  }
  // input is a room, validate that it's in the store
  if (!findRoom(input)) {
    throw new Error(
      `Validating given room, but room's id (${input.roomId}) was not found in the store`,
    );
  }
  return input;
}

// new event logic but doesn't match the patterns we used inside rooms
function addNewRoom() {
  // creating a roomId first, then validate it before creating and adding the room to store
  // NOTE: using library to make a shorter id that will be easier to type manually into a browser if that's how it's being shared.
  const roomId = cryptoRandomString({ length: 6, type: "distinguishable" });
  if (findRoom(roomId)) {
    throw new Error(
      `Somehow created a room for an id that already exists! roomId: ${roomId}`,
    );
  }
  // roomID is valid so finish and add to store
  const newRoom = newGameRoomData(roomId);
  allGameRooms[roomId] = newRoom;
  return newRoom;
}

function removeRoom(input: RoomOrId) {
  // just getting the room for custom validation error
  const roomId = getInputRoomId(input);
  // might want to make validation optional if there are common race condtitions
  const room = findRoomById(roomId);
  if (!room) {
    throw new Error(
      `Attempting to remove room ${roomId} but it isn't found in the store`,
    );
  }
  delete allGameRooms[roomId];
}

export const utils = {
  // input parsers
  getInputRoomId,
  getInputRoom,
  // fetch from store
  // findRoomById,
  findRoom,
  findRoomValidated,
  // modify store
  addNewRoom,
  removeRoom,
} as const;
