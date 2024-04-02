import type { GameRoomDataI } from "../game_room/room";
import { type GameRoomPlayersI, utils, eventFns } from "../game_room/players";
import type { ServerSocketOptions } from "../socket_types";

import { socketRoomUtils } from "../socket_utils";
import type { OnGameRoomEvent } from "../game_room/event_util_types";
import {
  wrapGameRoomEvent,
  wrapGameRoomEventNoUpdate,
} from "../game_room/event_utils";

export interface ServerToClientEvents {
  players_update: (roomId: string, playerData: GameRoomPlayersI) => void;
}

type eventFnsKeys = keyof typeof eventFns;
type eventFnType = (typeof eventFns)[eventFnsKeys];

export default function getPlayerHelpers({ socket }: ServerSocketOptions) {
  function emitPlayerData(room: GameRoomDataI) {
    socketRoomUtils
      .inGameRoom(socket, room.roomId)
      .emit("players_update", room.roomId, utils.getPlayersFromData(room));
  }

  // Tried using fromEntries as a way to build this with less (TS) issues than the commented out code above
  // return a copy of the eventFns with a copy where each event has it's logic wrapped by the logic above
  const eventKeys = Object.keys(eventFns) as eventFnsKeys[];
  const copyEvents = Object.fromEntries(
    eventKeys.map<[eventFnsKeys, eventFnType]>((key) => {
      return [key, wrapGameRoomEvent(eventFns[key], emitPlayerData)];
    }),
  ) as typeof eventFns;

  return {
    ...copyEvents,
    // another copy of existing fn that explicitly doesn't update the room
    onPlayerActionNoUpdate: wrapGameRoomEventNoUpdate(
      eventFns.onPlayerAction,
      emitPlayerData,
    ),
  } as const;
}

export type PlayerHelperTypes = ReturnType<typeof getPlayerHelpers>;
