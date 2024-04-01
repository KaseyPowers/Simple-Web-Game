import type { GameRoomDataI, GameRoomI } from "../game_room/room";
import type { EventsWithAck } from "../../util_types";
import type { ServerSocketOptions } from "../socket_types";

import { eventErrorHandler, socketRooms } from "../socket_utils";
import { utils as roomUtils } from "../game_room/room";
import {
  type RoomOrId,
  utils as managerUtils,
} from "../game_room/room_manager";

export interface ServerEventTypes {
  ServerToClientEvents: {
    room_info: (data: GameRoomI) => void;
  };
  ClientToServerEvents: EventsWithAck<{
    create_room: () => void;
    join_room: (roomId: string) => void;
  }>;
  SocketData: {
    roomId?: string;
  };
}
// will treat creating a room with joining since they overlap so much
export default function leaveRoomHandler(
  { socket }: ServerSocketOptions,
  helpers: {
    // helper function to call and potentially leave room if socket is in that room
    // thisSocketLeaveRoom: (roomId: string) => Promise<void>;
    addPlayer: (room: GameRoomDataI, playerId: string) => void;
  },
) {
  async function thisSocketLeaveRoom(roomId: string) {
    return Promise.resolve();
  }

  return {
    thisSocketLeaveRoom,
  };
}
