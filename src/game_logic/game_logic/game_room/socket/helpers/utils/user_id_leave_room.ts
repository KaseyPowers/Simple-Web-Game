import type { ServerType } from "~/socket_io/socket_types";

import { fetchUserSockets } from "~/socket_io/socket_utils";
import socketLeaveRoom from "./socket_leave_room";
// will have all sockets associated with this user leave the room
export default async function userIdLeaveRoom(
  io: ServerType,
  userId: string,
  roomId: string,
) {
  // this depends on new sockets joining a room for their userId
  const userSockets = await fetchUserSockets(io, userId);
  for (const socket of userSockets) {
    socketLeaveRoom(socket, roomId);
  }
}
