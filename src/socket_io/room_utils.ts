import type { ServerSocketType, ServerType } from "./socket_types";

// userId based rooms
const getUserIdRoom = (userId: string) => `user_${userId}`;
function inUserIdRoom(io: ServerType | ServerSocketType, userId: string) {
  return io.in(getUserIdRoom(userId));
}
function joinUserIdRoom(io: ServerSocketType, userId: string) {
  return io.join(getUserIdRoom(userId));
}
// gameRoom based Rooms
const getGameRoom = (roomId: string) => `room_${roomId}`;
function inGameRoom(io: ServerType | ServerSocketType, roomId: string) {
  return io.in(getGameRoom(roomId));
}
function joinGameRoom(io: ServerSocketType, userId: string) {
  return io.join(getGameRoom(userId));
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
