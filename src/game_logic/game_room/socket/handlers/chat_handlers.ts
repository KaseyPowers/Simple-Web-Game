import type {
  EventsWithAck,
  ServerHandlerObj,
} from "~/socket_io/socket_util_types";
import { eventErrorHandler } from "~/socket_io/socket_utils";
import socketRoomUtils from "~/socket_io/room_utils";

import type { ChatInputI } from "~/game_logic/game_room/core/types";
import type { GameRoomHelpers } from "../helpers";

interface SharedEvents {
  /** Message works both ways, from sender and then to propogate to the rest of the room */
  message: (msg: ChatInputI) => void;
}
export interface ServerEventTypes {
  ServerToClientEvents: SharedEvents;
  ClientToServerEvents: EventsWithAck<SharedEvents>;
}

// will treat creating a room with joining since they overlap so much
export default function registerChatHandlers(
  { socket }: ServerHandlerObj,
  // adding pick to only grab what we need
  helpers: Pick<GameRoomHelpers, "addChatMessage" | "onPlayerAction">,
) {
  // chat handler is pretty simple, won't require any helper wrappers
  socket.on(
    "message",
    eventErrorHandler((inputMsg) => {
      if (socket.data.roomId !== inputMsg.roomId) {
        throw new Error(
          `Invalid message! Socket received a message for room: ${inputMsg.roomId}, but socket is tied to room: ${socket.data.roomId}`,
        );
      }
      if (socket.data.userId !== inputMsg.userId) {
        throw new Error(
          `Invalid message! Socket received a message from: ${inputMsg.userId}, but socket is tied to userId: ${socket.data.userId}`,
        );
      }
      // will always trigger a change so just get room for following steps
      const [room] = helpers.addChatMessage(inputMsg.roomId, inputMsg);
      socketRoomUtils
        .toGameRoom(socket, inputMsg.roomId)
        .emit("message", inputMsg);
      // calling without the full response from chat message, since that will always trigger a change+emit
      helpers.onPlayerAction(room, inputMsg.userId);
    }),
  );
}
