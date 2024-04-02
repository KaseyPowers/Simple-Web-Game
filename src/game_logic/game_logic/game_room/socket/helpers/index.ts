import type { ServerSocketOptions } from "~/socket_io/socket_util_types";

import getPlayerHelpers from "./player_helpers";
import getLeaveRoomHelpers from "./leave_room_helpers";

// one function to combine all our helpers and handlers in the right order to make sure helpers are available when needed
export default function getGameRoomHelpers(options: ServerSocketOptions) {
  // get all the helpers to combine
  const playerHelpers = getPlayerHelpers(options);
  const leaveRoomHelpers = getLeaveRoomHelpers(options, playerHelpers);

  return {
    ...playerHelpers,
    ...leaveRoomHelpers,
  } as const;
}
export type GameRoomHelpers = ReturnType<typeof getGameRoomHelpers>;
