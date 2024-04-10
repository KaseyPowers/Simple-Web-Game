import type { ServerHandlerObj } from "~/socket_io/socket_util_types";

import getGameRoomHelpers from "./helpers";

import registerChatHandlers from "./handlers/chat_handlers";
import registerJoinRoomHandlers from "./handlers/join_room_handers";
import registerLeaveRoomHandlers from "./handlers/leave_room_handlers";

// one function to combine all our helpers and handlers in the right order to make sure helpers are available when needed
export default function registerGameRoomHandlers(options: ServerHandlerObj) {
  const gameRoomHelpers = getGameRoomHelpers(options);
  registerChatHandlers(options, gameRoomHelpers);
  registerJoinRoomHandlers(options, gameRoomHelpers);
  registerLeaveRoomHandlers(options, gameRoomHelpers);

  return gameRoomHelpers;
}
