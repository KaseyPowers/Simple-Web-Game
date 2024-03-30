import type {
  ServerSocketType,
  ServerType,
  RemoteSocketType,
} from "./socket_types";

// will wrap the ids with a template to make sure there aren't somehow overlaps
export const socketRooms = {
  userId: (userId: string) => `user_${userId}`,
  roomId: (roomId: string) => `room_${roomId}`,
};

/**
 * Server+Socket Utils
 * NOTE: These don't deal with validating the user/roomId just what socket-rooms and socket-data is set up
 */

// util for grabbing the `.in(room)` with the util string template applied
export function inGameRoom(io: ServerType | ServerSocketType, roomId: string) {
  return io.in(socketRooms.roomId(roomId));
}
export function inUserIdRoom(
  io: ServerType | ServerSocketType,
  userId: string,
) {
  return io.in(socketRooms.userId(userId));
}

// function to have a single socket leave a gameRoom and emit the leave event
export function socketLeaveRoom(
  socket: ServerSocketType | RemoteSocketType,
  roomId: string,
) {
  // assume that socket.leave will ignore the call if socket isn't in the room
  void socket.leave(socketRooms.roomId(roomId));

  if (socket.data.roomId === roomId) {
    delete socket.data.roomId;
  }
  // emit the leave event to this socket's client
  socket.emit("leave_room", roomId);
}
// grab all sockets for this user
export function getUserSockets(io: ServerType, userId: string) {
  return inUserIdRoom(io, userId).fetchSockets();
}

export async function hasSocketsInRoom(
  io: ServerType,
  roomId: string,
  userId: string,
) {
  const userSockets = await getUserSockets(io, userId);
  const socketRoomId = socketRooms.roomId(roomId);
  return userSockets.some((socket) => socket.rooms.has(socketRoomId));
}
// will have all sockets associated with this user leave the room
export async function userIdLeaveRoom(
  io: ServerType,
  userId: string,
  roomId: string,
) {
  // this depends on new sockets joining a room for their userId
  const userSockets = await getUserSockets(io, userId);
  for (const socket of userSockets) {
    socketLeaveRoom(socket, roomId);
  }
}
// while userId will make sure all sockets for userId leave the room, this makes sure that all sockets for a roomId leave
export async function allSocketsLeaveRoom(io: ServerType, roomId: string) {
  const roomSockets = await inGameRoom(io, roomId).fetchSockets();
  for (const socket of roomSockets) {
    socketLeaveRoom(socket, roomId);
  }
}
