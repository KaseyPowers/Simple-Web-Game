import type { GameRoomChatType } from "./chat";
import type { GameRoomPlayersDataI, GameRoomPlayersI } from "./players";
import { utils as playerUtils } from "./players";

// base values that will be garunteed for data/derived states
interface GameRoomBaseI {
  roomId: string;
  chat: GameRoomChatType;
}
// raw data stored for a game
export type GameRoomDataI = Readonly<GameRoomBaseI & GameRoomPlayersDataI>;

// GameRoom with derived values for sharing with client
export type GameRoomI = Readonly<GameRoomBaseI & GameRoomPlayersI>;

// just create a new room object with provided id
export function newGameRoomData(roomId: string): GameRoomDataI {
  return {
    roomId,
    // chat is simple enough to just define here
    chat: [],
    ...playerUtils.newPlayersData(),
  };
}

const getGameRoomFromData: (room: GameRoomDataI) => GameRoomI = (room) => {
  const { roomId, chat } = room;
  return {
    roomId,
    // chat doesn't change from raw data
    chat,
    ...playerUtils.getPlayersFromData(room),
  };
};

export const utils = {
  // newGameRoomData,
  getGameRoomFromData,
} as const;
// no events to export
// all manipulating of a room are done by sub-sections (like players), the only new value added by the room is the `roomId` which is static.
// larger scale manipulating is done by the room manager above this
