import type { ServerHelperOptions } from "~/socket_io/socket_util_types";
import { eventErrorHandler, hasSocketsInRoom } from "~/socket_io/socket_utils";

import type { GameRoomHelpers } from "../helpers";
import { utils as managerUtils } from "../../room_manager";

/** 30 second delay? could change/make variable */
export const disconnectOfflineDelay = 30 * 1000;

// will treat creating a room with joining since they overlap so much
export default function leaveRoomHandler(
  { io, socket }: ServerHelperOptions,
  helpers: Pick<GameRoomHelpers, "leaveRoom" | "setPlayerIsOffline">,
) {
  // event for client indicating that the user wants to leave the room
  socket.on(
    "leave_room",
    eventErrorHandler(async (roomId) => {
      if (socket.data.roomId !== roomId) {
        throw new Error(
          `Socket couldn't leave that room. Tried to leave room: ${roomId}, but socket is ${socket.data.roomId ? `tied to room: ${socket.data.roomId}` : "not in a room"}`,
        );
      }
      await helpers.leaveRoom(roomId);
    }),
  );
  // disconnect listener specifically for gameRoom leaving and offline status logic
  socket.on("disconnect", async () => {
    const { userId, roomId: socketRoomId } = socket.data;

    const room = socketRoomId && managerUtils.findRoom(socketRoomId);
    // room handlers only care about disconnect if the socket is in a room
    // the following logic only can run if a room is found to modify.
    // if the socket has a roomId defined but it doesn't have a room attatched, we don't need to worry about removing it because the sockets going away
    if (!room) {
      return;
    }
    const { roomId } = room;
    // at this point the current socket should have been auto-removed from the socket-rooms automatically, so this will only return true if userId has other open sockets in the room
    const stillInRoom = await hasSocketsInRoom(io, userId, roomId);
    // if no longer in the room, set to offline while waiting for reconnect/new connection
    if (!stillInRoom) {
      // set that the player is offline
      helpers.setPlayerIsOffline(room, userId, true);

      async function afterDelay() {
        // check if the userId has a new socket attatched to the room after the delay
        const isBackInRoom = await hasSocketsInRoom(io, userId, roomId);
        // if there are still no sockets connected, leave the room completely
        if (!isBackInRoom) {
          await helpers.leaveRoom(roomId);
        }
        // NOTE: could call to make sure player is back online here, but will assume it's updated by other socket joining
      }
      // use timeout to delay the check function. (split like this to try finding a clean pattern for the async fn in setTimeout)
      setTimeout(() => void afterDelay(), disconnectOfflineDelay);
    }
  });
}
