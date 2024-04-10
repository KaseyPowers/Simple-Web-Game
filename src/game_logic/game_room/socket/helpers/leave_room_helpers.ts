import type {
  EventsWithAck,
  ServerHandlerObj,
} from "~/socket_io/socket_util_types";

import { hasSocketsInRoom } from "~/socket_io/socket_utils";

import type { RoomOrId } from "~/game_logic/game_room/core/types";
import { utils } from "~/game_logic/game_room/core";

import type { CoreUpdaterHelpers } from "./core_updaters";

import socketLeaveRoom, { type SharedEvents } from "./utils/socket_leave_room";
import userIdLeaveRoom from "./utils/user_id_leave_room";
import allSocketsLeaveRoom from "./utils/all_sockets_leave_room";

export interface ServerEventTypes {
  ServerToClientEvents: SharedEvents;
  ClientToServerEvents: EventsWithAck<SharedEvents>;
}
// will treat creating a room with joining since they overlap so much
export default function getLeaveRoomHelpers(
  { io, socket }: ServerHandlerObj,
  helpers: Pick<CoreUpdaterHelpers, "removePlayer">,
) {
  // helper to have this socket's user fully leave the room
  async function leaveRoom(input: RoomOrId) {
    // get room, don't worry about validation
    const roomId = utils.inputRoomId(input);
    const { userId } = socket.data;
    // check for room, and remove player from room if defined
    const room = utils.inputRoom(roomId);
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
    const inputRoomId = utils.inputRoomId(input);
    const { roomId } = socket.data;
    if (roomId && roomId === inputRoomId) {
      return thisSocketLeaveRoom();
    }
  };

  // only have this socket leave it's current room if it's not tied to the input room
  thisSocketLeaveRoom.ifNotRoom = (input: RoomOrId) => {
    const inputRoomId = utils.inputRoomId(input);
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
