import type { ServerHandlerObj } from "~/socket_io/socket_util_types";
import socketRoomUtils from "~/socket_io/room_utils";

import type { GameRoomDataI } from "../../core/room";
import { type GameRoomPlayersI } from "../../core/players";
import { utils, playerUpdaterKeys } from "../../core";

import type { CoreUpdaterHelpers } from "./core_updaters";

export interface ServerToClientEvents {
  players_update: (roomId: string, playerData: GameRoomPlayersI) => void;
}

export default function getPlayerHelpers(
  { socket }: ServerHandlerObj,
  helpers: CoreUpdaterHelpers,
) {
  function emitPlayerData(room: GameRoomDataI) {
    socketRoomUtils
      .inGameRoom(socket, room.roomId)
      .emit("players_update", room.roomId, utils.getPlayersFromData(room));
  }
  // just add the emitData to each helper, since they are a copy specific to this socket
  playerUpdaterKeys.forEach((key) => {
    helpers[key].onChangeFns.push(emitPlayerData);
  });
}
