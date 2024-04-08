import type { ServerSocketType, ServerType } from "./socket_types";

// userId based rooms
const getUserIdRoom = (userId: string) => `user_${userId}`;
function inUserIdRoom(io: ServerType | ServerSocketType, userId: string) {
  return io.in(getUserIdRoom(userId));
}
function joinUserIdRoom(socket: ServerSocketType, userId: string) {
  if (socket.data.userId !== userId) {
    throw new Error(
      "Socket's have userId assigned by auth, and shouldn't be changed",
    );
  }
  return socket.join(getUserIdRoom(userId));
}
// gameRoom based Rooms
const getGameRoom = (roomId: string) => `room_${roomId}`;
function inGameRoom(io: ServerType | ServerSocketType, roomId: string) {
  return io.in(getGameRoom(roomId));
}
function joinGameRoom(socket: ServerSocketType, roomId: string) {
  // assign the roomId to data
  socket.data.roomId = roomId;
  return socket.join(getGameRoom(roomId));
}

// will wrap the ids with a template to make sure there aren't somehow overlaps
const socketRoomUtils = {
  getUserIdRoom,
  userId: getUserIdRoom,
  inUserIdRoom,
  toUserIdRoom: inUserIdRoom,
  joinUserIdRoom,
  getGameRoom,
  roomId: getGameRoom,
  inGameRoom,
  toGameRoom: inGameRoom,
  joinGameRoom,
} as const;

export default socketRoomUtils;
