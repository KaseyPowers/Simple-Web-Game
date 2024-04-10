import type { ServerType } from "~/socket_io/socket_types";

import socketRoomUtils from "~/socket_io/room_utils";
import socketLeaveRoom from "./socket_leave_room";

// while userId will make sure all sockets for userId leave the room, this makes sure that all sockets for a roomId leave
export default async function allSocketsLeaveRoom(
  io: ServerType,
  roomId: string,
) {
  const roomSockets = await socketRoomUtils
    .inGameRoom(io, roomId)
    .fetchSockets();
  for (const socket of roomSockets) {
    socketLeaveRoom(socket, roomId);
  }
}
