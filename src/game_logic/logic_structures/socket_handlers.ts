import type { ServerSocketOptions } from "./socket_types";

import getPlayerHelpers from "./helpers/player_helpers";
import getLeaveRoomHelpers from "./helpers/leave_room_helpers";

import joinRoomHandler from "./handlers/join_room_hander";
import leaveRoomHandler from "./handlers/leave_room_handlers";

// one function to combine all our helpers and handlers in the right order to make sure helpers are available when needed
export function handlers(options: ServerSocketOptions) {
  const playerHelpers = getPlayerHelpers(options);
  const leaveRoomHelpers = getLeaveRoomHelpers(options, playerHelpers);
  // combine helpers, this name is getting a bit long though?
  const playerAndLeaveRoomHelpers = {
    ...playerHelpers,
    ...leaveRoomHelpers,
  };
  joinRoomHandler(options, playerAndLeaveRoomHelpers);
  leaveRoomHandler(options, playerAndLeaveRoomHelpers);
}
