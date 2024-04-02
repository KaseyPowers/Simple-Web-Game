import type { ServerToClientEvents as PlayerServerToClientEventTypes } from "./helpers/player_helpers";
import type { ServerEventTypes as LeaveRoomHelperEventTypes } from "./helpers/leave_room_helpers";
import type { ServerEventTypes as JoinRoomEventTypes } from "./handlers/join_room_hander";
import type { ServerEventTypes as ChatEventTypes } from "./handlers/chat_handler";

// Combine all the event types to a single export
export type ServerEventTypes = {
  ServerToClientEvents: PlayerServerToClientEventTypes;
} & JoinRoomEventTypes &
  LeaveRoomHelperEventTypes &
  ChatEventTypes;
