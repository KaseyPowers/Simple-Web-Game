import type { ChatInputI } from "../game_room/chat";
import type { EventsWithAck } from "../../util_types";
import type { ServerSocketOptions } from "../socket_types";

import { eventErrorHandler, socketRoomUtils } from "../socket_utils";
import { utils as roomUtils } from "../game_room/room";
import {
  type RoomOrId,
  utils as managerUtils,
} from "../game_room/room_manager";
import { type GameRoomI, eventFns } from "../game_room/chat";

import type { PlayerHelperTypes } from "../helpers/player_helpers";
import type { LeaveRoomHelperTypes } from "../helpers/leave_room_helpers";

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
  socket.on(
    "message",
    eventErrorHandler((inputMsg) => {
      // TODO;
    }),
  );
}
