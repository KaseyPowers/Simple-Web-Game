import type { GameRoomDataI, GameRoomI } from "../game_room/room";
import type { EventsWithAck } from "../../util_types";

import type {
  ServerSocketType,
  ServerType,
  RemoteSocketType,
  ServerSocketOptions,
} from "../socket_types";
import {
  socketRoomUtils,
  getUserSockets,
  hasSocketsInRoom,
} from "../socket_utils";

import { type RoomOrId } from "../game_room/room_manager";
import { utils } from "../game_room";

import type { PlayerHelperTypes } from "./player_helpers";

function socketLeaveRoom(
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
// will have all sockets associated with this user leave the room
async function userIdLeaveRoom(io: ServerType, userId: string, roomId: string) {
  // this depends on new sockets joining a room for their userId
  const userSockets = await getUserSockets(io, userId);
  for (const socket of userSockets) {
    socketLeaveRoom(socket, roomId);
  }
}

// while userId will make sure all sockets for userId leave the room, this makes sure that all sockets for a roomId leave
export async function allSocketsLeaveRoom(io: ServerType, roomId: string) {
  const roomSockets = await socketRoomUtils
    .inGameRoom(io, roomId)
    .fetchSockets();
  for (const socket of roomSockets) {
    socketLeaveRoom(socket, roomId);
  }
}

interface SharedEvents {
  /** Leave room:
   * Client->Server: informing room that user is leaving the room by choice
   * Server->Client: informing client that user is leaving a room.
   * - Right now this would only happen if user left room with multiple tabs open so all tabs will leave.
   * - Potential other uses would be if a user get's kicked out of the room by some means.
   *
   */
  leave_room: (roomId: string) => void;
}

export interface ServerEventTypes {
  ServerToClientEvents: SharedEvents;
  ClientToServerEvents: EventsWithAck<SharedEvents>;
}
// will treat creating a room with joining since they overlap so much
export default function getLeaveRoomHelpers(
  { io, socket }: ServerSocketOptions,
  helpers: Pick<PlayerHelperTypes, "removePlayer">,
) {
  // helper to have this socket's user fully leave the room
  async function leaveRoom(input: RoomOrId) {
    // get room, don't worry about validation
    const roomId = utils.getInputRoomId(input);
    const { userId } = socket.data;
    // check for room, and remove player from room if defined
    const room = utils.findRoom(roomId);
    if (room) {
      const [newRoom, madeChange] = helpers.removePlayer(room, userId);
      // if room is empty, remove from the store and remove all sockets from room
      if (madeChange && utils.gameRoomIsEmpty(newRoom)) {
        utils.removeRoom(newRoom);
        /**
         * if closing the room, remove this room all sockets
         * NOTE: returning because removing for this userId would be redundant (no users should be found still tied to the room regardless of userId)
         */
        return allSocketsLeaveRoom(io, newRoom.roomId);
      }
    }
    // make sure all sockets for this user are removed from the room.
    await userIdLeaveRoom(io, userId, roomId);
  }
  /**
   * thisSocketLeaveRoom will have the socket leave from the whatever room it is in currently
   */
  async function thisSocketLeaveRoom() {
    const { userId, roomId } = socket.data;
    // if not in a room, return early
    if (!roomId) {
      return;
    }
    // leave this room
    socketLeaveRoom(socket, roomId);
    // check if the userId has other sockets still in the room.
    const stillInRoom = await hasSocketsInRoom(io, roomId, userId);
    if (!stillInRoom) {
      await leaveRoom(roomId);
    }
  }
  // only have this socket leave the room if it's tied to this socket
  thisSocketLeaveRoom.ifRoom = (input: RoomOrId) => {
    const inputRoomId = utils.getInputRoomId(input);
    const { roomId } = socket.data;
    if (roomId && roomId === inputRoomId) {
      return thisSocketLeaveRoom();
    }
  };

  // only have this socket leave the room if it's not tied to the input room
  thisSocketLeaveRoom.ifNotRoom = (input: RoomOrId) => {
    const inputRoomId = utils.getInputRoomId(input);
    const { roomId } = socket.data;
    if (roomId && roomId !== inputRoomId) {
      return thisSocketLeaveRoom();
    }
  };

  return {
    leaveRoom,
    thisSocketLeaveRoom,
  } as const;
}

export type LeaveRoomHelperTypes = ReturnType<typeof getLeaveRoomHelpers>;
