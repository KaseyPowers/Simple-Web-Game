import cryptoRandomString from "crypto-random-string";

import type { GameRoomPlayersDataI, GameRoomPlayersI } from "./players";
import { utils as playerUtils } from "./players";

// base values that will be garunteed for data/derived states
interface GameRoomBaseI {
  roomId: string;
}
// raw data stored for a game
export interface GameRoomDataI extends GameRoomBaseI, GameRoomPlayersDataI {
  chat: string[];
}
// GameRoom with derived values for sharing with client
export interface GameRoomI extends GameRoomBaseI, GameRoomPlayersI {
  chat: string[];
}

// just create a new room object with provided id
function newGameRoomData(roomId: string): GameRoomDataI {
  return {
    roomId,
    chat: [],
    ...playerUtils.newPlayersData(),
  };
}

const getGameRoomFromData: (room: GameRoomDataI) => GameRoomI = (room) => {
  const { roomId, chat } = room;
  return {
    roomId,
    chat,
    ...playerUtils.getPlayersFromData(room),
  };
};

export const utils = {
  newGameRoomData,
  getGameRoomFromData,
} as const;
// no events to export
// all manipulating of a room are done by sub-sections (like players), the only new value added by the room is the `roomId` which is static.
// larger scale manipulating is done by the room manager above this
