/**
 * Pattern used:
 * - <>BaseI = shared structures between data and final/used structure
 * - <>DataI = how the basic data structure is stored
 * - <>I = the derived/final/simplified structure that is sent to the client
 */

export interface RoomPlayersDataI {
  // players is an array because we care for the order that players join the room
  players: string[];
  offlinePlayers: Set<string>;
}
// how the data will be calculated for display
export interface RoomPlayersI {
  players: string[];
  // status obj for easy checking if a player is offline
  offlinePlayers: Record<string, true>;
}
// base values that will be garunteed for data/derived states
interface GameRoomBaseI {
  roomId: string;
}
// raw data stored for a game
export interface GameRoomDataI extends GameRoomBaseI, RoomPlayersDataI {
  chat: string[];
}
// GameRoom with derived values for sharing with client
export interface GameRoomI extends GameRoomBaseI, RoomPlayersI {
  chat: string[];
}
