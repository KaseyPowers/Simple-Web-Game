// re-export types that need to be defined elsewhere
export type { ChatUpdaterKeys, PlayerUpdaterKeys } from "./core_udpaters";

// core types
export interface ChatDataI {
  userId: string;
  msg: string;
}

export interface ChatInputI extends ChatDataI {
  roomId: string;
}

export type GameRoomChatType = Readonly<ChatDataI[]>;

export interface GameRoomPlayersDataI {
  // players is an array because we care for the order that players join the room
  players: string[];
  offlinePlayers: Set<string>;
}
// how the data will be calculated for display
export interface GameRoomPlayersI {
  players: string[];
  // status obj for easy checking if a player is offline
  offlinePlayers: string[];
}

// base values that will be garunteed for data/derived states
interface GameRoomBaseI {
  roomId: string;
  chat: GameRoomChatType;
}
// raw data stored for a game
export type GameRoomDataI = Readonly<GameRoomBaseI & GameRoomPlayersDataI>;

// GameRoom with derived values for sharing with client
export type GameRoomI = Readonly<GameRoomBaseI & GameRoomPlayersI>;

export type RoomOrId = string | GameRoomDataI;
