import type { Mutable } from "~/utils/types";
import type { ServerHelperOptions } from "~/socket_io/socket_util_types";

import socketRoomUtils from "~/socket_io/room_utils";

import type { GameRoomDataI } from "../../core/room";
import {
  type GameRoomPlayersI,
  updaters as playerUpdaters,
} from "../../core/players";
import { gameRoomUtils } from "../../core";
import { wrapStoreUpdater } from "../../manager/create_updater";
import { storeUpdaters } from "../../manager";

export interface ServerToClientEvents {
  players_update: (roomId: string, playerData: GameRoomPlayersI) => void;
}
type playerUpdaterKeysType = keyof typeof playerUpdaters;
export type PlayerHelperTypes = Pick<
  typeof storeUpdaters,
  playerUpdaterKeysType
>;
const playerUpdaterKeys = Object.keys(
  playerUpdaters,
) as playerUpdaterKeysType[];

export default function getPlayerHelpers({ socket }: ServerHelperOptions) {
  function emitPlayerData(room: GameRoomDataI) {
    socketRoomUtils
      .inGameRoom(socket, room.roomId)
      .emit(
        "players_update",
        room.roomId,
        gameRoomUtils.getPlayersFromData(room),
      );
  }

  return playerUpdaterKeys.reduce((output, key) => {
    output[key] = wrapStoreUpdater(storeUpdaters[key], emitPlayerData);
    return output;
  }, {} as Mutable<PlayerHelperTypes>) as PlayerHelperTypes;
}
