import type { ServerSocketOptions } from "./socket_types";

import createPlayerHelpers from "./helpers/player_helpers";

import leaveRoomHandler from "./handlers/leave_room_handlers";
import joinRoomHandler from "./handlers/join_room_hander";

// one function to combine all our helpers and handlers in the right order to make sure helpers are available when needed
export function handlers(options: ServerSocketOptions) {
  const playerHelpers = createPlayerHelpers(options);
  const leaveRoomHelpers = leaveRoomHandler(options, playerHelpers);
  joinRoomHandler(options, {
    ...playerHelpers,
    ...leaveRoomHelpers,
  });
}
