import type { ServerHandlerObj } from "~/socket_io/socket_util_types";

import getCoreUpdaterHelpers from "./core_updaters";
import getPlayerHelpers from "./player_helpers";
import getLeaveRoomHelpers from "./leave_room_helpers";

// one function to combine all our helpers and handlers in the right order to make sure helpers are available when needed
export default function getGameRoomHelpers(options: ServerHandlerObj) {
  // starter helpers that don't need arguments
  const updaterHelpers = getCoreUpdaterHelpers();
  // get all the helpers to combine
  getPlayerHelpers(options, updaterHelpers);
  const leaveRoomHelpers = getLeaveRoomHelpers(options, updaterHelpers);

  return {
    ...updaterHelpers,
    ...leaveRoomHelpers,
  } as const;
}
export type GameRoomHelpers = ReturnType<typeof getGameRoomHelpers>;
