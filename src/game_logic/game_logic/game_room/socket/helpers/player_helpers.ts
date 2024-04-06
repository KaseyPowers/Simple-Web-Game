import type { ServerHelperOptions } from "~/socket_io/socket_util_types";

import socketRoomUtils from "~/socket_io/room_utils";

import type { UpdateBuilderOptions } from "../../../updater_types";
import { createUpdaterBuilder } from "../../../updater";

import type { GameRoomDataI } from "../../core/room";
import { type GameRoomPlayersI } from "../../core/players";
import type { PlayerUpdaterKeys } from "../../core/core_udpaters";
import { utils, updaters, playerUpdaterKeys } from "../../core";

export interface ServerToClientEvents {
  players_update: (roomId: string, playerData: GameRoomPlayersI) => void;
}
// type playerUpdaterKeysType = keyof typeof playerUpdaters;
export type PlayerHelperTypes = Pick<typeof updaters, PlayerUpdaterKeys>;

export default function getPlayerHelpers({ socket }: ServerHelperOptions) {
  function emitPlayerData(room: GameRoomDataI) {
    socketRoomUtils
      .inGameRoom(socket, room.roomId)
      .emit("players_update", room.roomId, utils.getPlayersFromData(room));
  }
  return createUpdaterBuilder({
    onChangeFns: [emitPlayerData],
    // too lazy to figure update type stuff more to handle knowing these updaters have the inputParser defined already
  } as UpdateBuilderOptions<GameRoomDataI, string>).mapExtendUpdaters<
    typeof updaters,
    PlayerUpdaterKeys
  >(updaters, playerUpdaterKeys);
}
