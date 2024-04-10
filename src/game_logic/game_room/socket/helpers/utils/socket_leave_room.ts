import type {
  ServerSocketType,
  RemoteSocketType,
} from "~/socket_io/socket_types";

import socketRoomUtils from "~/socket_io/room_utils";

export interface SharedEvents {
  /** Leave room:
   * Client->Server: informing room that user is leaving the room by choice
   * Server->Client: informing client that user is leaving a room.
   * - Right now this would only happen if user left room with multiple tabs open so all tabs will leave.
   * - Potential other uses would be if a user get's kicked out of the room by some means.
   *
   */
  leave_room: (roomId: string) => void;
}

// base function that removes a socket from the room emits the leave_room event
export default function socketLeaveRoom(
  socket: ServerSocketType | RemoteSocketType,
  roomId: string,
) {
  // assume that socket.leave will ignore the call if socket isn't in the room
  void socket.leave(socketRoomUtils.roomId(roomId));
  if (socket.data.roomId === roomId) {
    delete socket.data.roomId;
  }
  // emit the leave event to this socket's client
  socket.emit("leave_room", roomId);
}
