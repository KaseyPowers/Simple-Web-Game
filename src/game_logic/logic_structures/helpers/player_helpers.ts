import type { GameRoomDataI } from "../game_room/room";
import { type GameRoomPlayersI, utils, eventFns } from "../game_room/players";
import type { OnGameRoomEvent } from "../game_room/event_util_types";

import type { ServerSocketOptions } from "../socket_types";
import { inGameRoom } from "../socket_utils";

export interface ServerToClientEvents {
  players_update: (roomId: string, playerData: GameRoomPlayersI) => void;
}

export default function createPlayerHelpers({ socket }: ServerSocketOptions) {
  function emitPlayerData(room: GameRoomDataI) {
    inGameRoom(socket, room.roomId).emit(
      "players_update",
      room.roomId,
      utils.getPlayersFromData(room),
    );
  }

  function wrapPlayerEventFn<T extends unknown[]>(
    fn: OnGameRoomEvent<T>,
  ): OnGameRoomEvent<T> {
    return (...args: Parameters<typeof fn>) => {
      const response = fn(...args);
      const [room, onChange] = response;
      // if the event changes the room, emit that change before returning
      if (onChange) {
        emitPlayerData(room);
      }
      return response;
    };
  }
  // return a copy of the eventFns with a copy where each event has it's logic wrapped by the logic above
  return (Object.keys(eventFns) as (keyof typeof eventFns)[]).reduce(
    (output, key) => {
      output[key] = wrapPlayerEventFn(eventFns[key]);
      return output;
    },
    {},
  ) as typeof eventFns;
}
