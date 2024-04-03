import type {
  EventsWithAck,
  ServerHelperOptions,
} from "~/socket_io/socket_util_types";

import socketRoomUtils from "~/socket_io/room_utils";
import { eventErrorHandler } from "~/socket_io/socket_utils";

import { type RoomOrId, utils as managerUtils } from "../../room_manager";
import { type GameRoomI, utils as roomUtils } from "../../core/room";

import type { PlayerHelperTypes } from "../helpers/player_helpers";
import type { LeaveRoomHelperTypes } from "../helpers/leave_room_helpers";

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
  { socket }: ServerHelperOptions,
  // adding pick to only grab what we need
  helpers: Pick<PlayerHelperTypes, "addPlayer"> &
    Pick<LeaveRoomHelperTypes, "thisSocketLeaveRoom">,
) {
  // join room logic (used by join and create events)
  async function joinRoom(input: RoomOrId) {
    const room = managerUtils.findRoomValidated(input);
    // socket leave room if not in the new room
    await helpers.thisSocketLeaveRoom.ifNotRoom(room.roomId);
    // add this player to the room
    helpers.addPlayer(room, socket.data.userId);
    void socketRoomUtils.joinGameRoom(socket, room.roomId);
    socket.data.roomId = room.roomId;
    socket.emit("room_info", roomUtils.getGameRoomFromData(room));
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
      const room = managerUtils.addNewRoom();
      // TODO: Get the joinRoom util
      await joinRoom(room);
    }),
  );
}
