import cryptoRandomString from "crypto-random-string";

import { type GameRoomDataI, utils as gameRoomUtils } from "./room";

import { allGameRooms } from "../shared_data";

// this just returns the room found for this ID
function findRoom(roomId: string): GameRoomDataI | undefined {
  return allGameRooms[roomId];
}

export type RoomOrId = string | GameRoomDataI;
/** Util to grab just the roomId */
function getRoomId(input: RoomOrId): string {
  return typeof input === "string" ? input : input.roomId;
}
// get's the current state of the room from storage, even if a room object is passed in
// function getCurrentRoom(input: RoomOrId): GameRoomDataI | undefined {
//   const roomId = getRoomId(input);
//   return findRoom(roomId);
// }
// NOTE: Part of me wants this to check for the room in the global store too, but leaving that to the validate fn
function getRoom(input: RoomOrId): GameRoomDataI | undefined {
  // tries to find the room if input is a string (assumed roomId). Otherwise keep the room obj
  return typeof input === "string" ? findRoom(input) : input;
}
// NOTE: Should this return the room passed in or grab state room from `getCurrentRoom` instead?
function getRoomValidated(input: RoomOrId): GameRoomDataI {
  if (typeof input === "string") {
    const room = findRoom(input);
    if (!room) {
      throw new Error(`No room was found for ${input}`);
    }
    return room;
  }
  // input is a room, validate that it's in the store
  if (!findRoom(input.roomId)) {
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
  const newRoom = gameRoomUtils.newGameRoomData(roomId);
  allGameRooms[roomId] = newRoom;
  return newRoom;
}

function removeRoom(input: Parameters<typeof getRoom>[0]) {
  // just getting the room for custom validation error
  const roomId = getRoomId(input);
  // might want to make validation optional if there are common race condtitions
  const room = findRoom(roomId);
  if (!room) {
    throw new Error(
      `Attempting to remove room ${roomId} but it isn't found in the store`,
    );
  }
  delete allGameRooms[roomId];
}

export const utils = {
  findRoom,
  getRoomId,
  // getCurrentRoom,
  getRoom,
  getRoomValidated,
  addNewRoom,
  removeRoom,
} as const;
