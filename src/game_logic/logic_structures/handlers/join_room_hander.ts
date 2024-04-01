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
export default function joinRoomHandler(
  { socket }: ServerSocketOptions,
  helpers: {
    // helper function to call and potentially leave room if socket is in that room
    thisSocketLeaveRoom: (roomId: string) => Promise<void>;
    addPlayer: (room: GameRoomDataI, playerId: string) => void;
  },
) {
  // join room logic
  async function joinRoom(input: RoomOrId) {
    const room = managerUtils.getRoomValidated(input);
    // TODO: Join room logic
    await helpers.thisSocketLeaveRoom(room.roomId);
    // add this player to the room
    helpers.addPlayer(room, socket.data.userId);
    void socket.join(socketRooms.roomId(room.roomId));
    socket.data.roomId = room.roomId;
    socket.emit("room_info", roomUtils.getGameRoomFromData(room));
  }

  socket.on(
    "create_room",
    eventErrorHandler(async () => {
      // create the new room
      const room = managerUtils.addNewRoom();
      // TODO: Get the joinRoom util
      await joinRoom(room);
    }),
  );
  socket.on(
    "join_room",
    eventErrorHandler(async (roomId: string) => {
      await joinRoom(roomId);
    }),
  );
}
