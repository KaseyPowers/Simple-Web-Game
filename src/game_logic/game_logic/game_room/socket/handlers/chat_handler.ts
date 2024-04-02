import type {
  EventsWithAck,
  ServerSocketOptions,
} from "~/socket_io/socket_util_types";

import { eventErrorHandler, socketRoomUtils } from "~/socket_io/socket_utils";

import { utils as managerUtils } from "../../room_manager";

import { createRoomEventFn, wrapGameRoomEvent } from "../../event_utils";
import { type ChatInputI, eventFns } from "../../chat";

import type { PlayerHelperTypes } from "../helpers/player_helpers";
import type { OnEventResponse } from "../../event_util_types";

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
  { socket }: ServerSocketOptions,
  // adding pick to only grab what we need
  helpers: Pick<PlayerHelperTypes, "onPlayerActionNoUpdate">,
) {
  // create a room Event fn that adds the chat message + emit event + make sure user is online
  const addChatWrapper = wrapGameRoomEvent(
    createRoomEventFn((room, inputMsg: ChatInputI) => {
      let output: OnEventResponse = [room, false];
      output = eventFns.addChatMessage(output, inputMsg);
      // emit the message event back to the gameRoom (after addChatMessage would validate any issues)
      socketRoomUtils
        .toGameRoom(socket, inputMsg.roomId)
        .emit("message", inputMsg);
      // wrapped function that will emit the right update event but not update the store yet
      output = helpers.onPlayerActionNoUpdate(output, inputMsg.userId);
      return output;
    }),
  );

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
      const room = managerUtils.findRoomValidated(inputMsg.roomId);
      // call wrapped event handler
      addChatWrapper(room, inputMsg);
    }),
  );
}
