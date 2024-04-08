import type { ServerHandlerObj } from "~/socket_io/socket_util_types";

import getGameRoomHelpers from "./helpers";

import joinRoomHandler from "./handlers/join_room_hander";
import leaveRoomHandler from "./handlers/leave_room_handlers";

// one function to combine all our helpers and handlers in the right order to make sure helpers are available when needed
export function gameRoomHandlers(options: ServerHandlerObj) {
  const gameRoomHelpers = getGameRoomHelpers(options);
  joinRoomHandler(options, gameRoomHelpers);
  leaveRoomHandler(options, gameRoomHelpers);

  return gameRoomHelpers;
}
