import type { GameRoomDataI } from "./room";
import type { GameRoomEventDef, OnEventResponse } from "./event_util_types";
import { createRoomEventFn } from "./event_utils";

export interface GameRoomPlayersDataI {
  // players is an array because we care for the order that players join the room
  players: string[];
  offlinePlayers: Set<string>;
}
// how the data will be calculated for display
export interface GameRoomPlayersI {
  players: string[];
  // status obj for easy checking if a player is offline
  offlinePlayers: Record<string, true>;
}
// create empty playerData
function newPlayersData(): GameRoomPlayersDataI {
  return {
    players: [],
    offlinePlayers: new Set(),
  };
}
// getOutputData
function getPlayersFromData(room: GameRoomDataI): GameRoomPlayersI {
  const { players, offlinePlayers } = room;
  return {
    players,
    offlinePlayers: [...offlinePlayers].reduce(
      (obj, offlineId) => {
        obj[offlineId] = true;
        return obj;
      },
      {} as GameRoomPlayersI["offlinePlayers"],
    ),
  };
}

// helper utilities
function gameRoomIsEmpty(room: GameRoomDataI): boolean {
  return room.players.length <= 0;
}
function isPlayerInRoom(room: GameRoomDataI, playerId: string): boolean {
  return room.players.includes(playerId);
}

function validatePlayerInRoom(room: GameRoomDataI, playerId: string) {
  if (!isPlayerInRoom(room, playerId)) {
    throw new Error(
      `Can't perform action, player (${playerId}) isn't in this GameRoom`,
    );
  }
}

export const utils = {
  newPlayersData,
  getPlayersFromData,
  gameRoomIsEmpty,
  isPlayerInRoom,
  validatePlayerInRoom,
} as const;

const setPlayerIsOffline = createRoomEventFn(
  (room, playerId: string, isOffline = false) => {
    // throw error if player is not in this room
    validatePlayerInRoom(room, playerId);

    // check if the new status is different from current one
    if (room.offlinePlayers.has(playerId) !== isOffline) {
      // copy the offline players before modifying
      const newOfflinePlayers = new Set([...room.offlinePlayers]);
      if (isOffline) {
        newOfflinePlayers.add(playerId);
      } else {
        newOfflinePlayers.delete(playerId);
      }
      return [
        {
          ...room,
          offlinePlayers: newOfflinePlayers,
        },
        true,
      ];
    }

    return [room, false];
  },
);
// simple wrapper to call whenever a player does something, making sure they are not offline
const onPlayerAction = createRoomEventFn((room, playerId: string) => {
  return setPlayerIsOffline(room, playerId, false);
});

const _addPlayer: GameRoomEventDef<[playerId: string]> = (room, playerId) => {
  if (!isPlayerInRoom(room, playerId)) {
    // copy room and create new players array with new player added
    return [
      {
        ...room,
        players: [...room.players, playerId],
      },
      true,
    ];
  }
  return [room, false];
};

const addPlayer = createRoomEventFn((room, playerId: string) => {
  const output = _addPlayer(room, playerId);
  // chain/add step to make sure the player is online, regardless of if they were actually added
  return onPlayerAction(output, playerId);
});

const removePlayer = createRoomEventFn((room, playerId: string) => {
  let newPlayers: false | Partial<GameRoomPlayersDataI> = false;

  // if player is in room, start changes to remove it
  if (isPlayerInRoom(room, playerId)) {
    newPlayers = {
      players: room.players.filter((id) => id !== playerId),
    };
  }
  /**
   * make sure player is removed from (online) status tracking too
   * NOTE: To reduce redundant code, could technically combine this with the `setPlayerIsOffline` logic
   * but if reading this code at a glance, would be odd to see "set player online" as part of removing it.
   * Also status tracking might change so might as well keep this seperate in case of that.
   */
  //
  //
  if (room.offlinePlayers.has(playerId)) {
    // check that newPlayers isn't false. That would only be possible if id was in the offline players but not in the players array. Which shouldn't happen, so throw an error
    if (!newPlayers) {
      throw new Error(
        `Removed user ${playerId} from offlinePlayers but didn't remove it from the players list. This shouldn't be possible`,
      );
    }
    // copy the set then delete playerId from it
    newPlayers.offlinePlayers = new Set([...room.offlinePlayers]);
    newPlayers.offlinePlayers.delete(playerId);
  }

  return newPlayers
    ? [
        {
          ...room,
          ...newPlayers,
        },
        true,
      ]
    : [room, false];
});

export const eventFns = {
  setPlayerIsOffline,
  onPlayerAction,
  addPlayer,
  removePlayer,
} as const;
