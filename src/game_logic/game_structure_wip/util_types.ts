import type { GameRoomDataI } from "./game_types";
import type { ServerType, ServerSocketType } from "./socket_types";

export type allRoomsData = Record<string, GameRoomDataI>;
export interface ServerHelperUtilArgs {
  io: ServerType;
  socket: ServerSocketType;
  gameRooms: allRoomsData;
}
