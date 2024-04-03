import type {
  EventsWithAck,
  ServerHelperOptions,
} from "~/socket_io/socket_util_types";
import { eventErrorHandler } from "~/socket_io/socket_utils";
import socketRoomUtils from "~/socket_io/room_utils";

import { type ChatInputI } from "../../core/chat";
import type { PlayerHelperTypes } from "../helpers/player_helpers";
import { storeUpdaters } from "../../manager";

interface SharedEvents {
  /** Message works both ways, from sender and then to propogate to the rest of the room */
  message: (msg: ChatInputI) => void;
}
export interface ServerEventTypes {
  ServerToClientEvents: SharedEvents;
  ClientToServerEvents: EventsWithAck<SharedEvents>;
}

// will treat creating a room with joining since they overlap so much
export default function joinRoomHandler(
  { socket }: ServerHelperOptions,
  // adding pick to only grab what we need
  helpers: Pick<PlayerHelperTypes, "onPlayerAction">,
) {
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
      const [room] = storeUpdaters.addChatMessage(inputMsg.roomId, inputMsg);
      socketRoomUtils
        .toGameRoom(socket, inputMsg.roomId)
        .emit("message", inputMsg);
      // calling without the full response from chat message, since that will always trigger a change+emit
      helpers.onPlayerAction(room, inputMsg.userId);
    }),
  );
}
