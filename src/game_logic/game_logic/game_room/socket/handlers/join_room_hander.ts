import type {
  EventsWithAck,
  ServerHandlerObj,
} from "~/socket_io/socket_util_types";

import socketRoomUtils from "~/socket_io/room_utils";
import { eventErrorHandler } from "~/socket_io/socket_utils";

import { type RoomOrId } from "../../core/store_utils";
import { type GameRoomI } from "../../core/room";
import { utils } from "../../core";

import type { GameRoomHelpers } from "../helpers";

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
  { socket }: ServerHandlerObj,
  // adding pick to only grab what we need
  helpers: GameRoomHelpers,
) {
  // join room logic (used by join and create events)
  async function joinRoom(input: RoomOrId) {
    const room = utils.getRoom(input);
    // socket leave room if not in the new room
    await helpers.thisSocketLeaveRoom.ifNotRoom(room.roomId);
    // add this player to the room
    helpers.addPlayer(room, socket.data.userId);
    void socketRoomUtils.joinGameRoom(socket, room.roomId);
    socket.emit("room_info", utils.getGameRoomFromData(room));
  }
  // this event just joins the provided room
  socket.on(
    "join_room",
    eventErrorHandler(async (roomId: string) => {
      await joinRoom(roomId);
    }),
  );
  // creating a room just adds a new room and joins it.
  socket.on(
    "create_room",
    eventErrorHandler(async () => {
      // create the new room
      const room = utils.addNewRoom();
      // TODO: Get the joinRoom util
      await joinRoom(room);
    }),
  );
}
