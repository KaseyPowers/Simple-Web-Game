import type { GameRoomDataI } from "./room";
import type { UpdaterDef } from "./updater_types";
import { createUpdater } from "./updater";

/**
 * Notes on OfflinePlayers/general player status in room
 * I was originally going to send an object { userId: true} (treating undefined userId's as false, so not offline)
 * This was to make lookups easy and maybe make merging different status objects between this and other trackers later
 * but that object is slightly wasteful on sending that boolean when it's easily figured out on the client side from an array.
 * Plus checking for offline with isOffline = offlinePlayers[userId] vs. offlinePlayers.includes(userId) is not that different. (can memoize the object conversion on client if it does help performance)
 */

export interface GameRoomPlayersDataI {
  // players is an array because we care for the order that players join the room
  players: string[];
  offlinePlayers: Set<string>;
}
// how the data will be calculated for display
export interface GameRoomPlayersI {
  players: string[];
  // status obj for easy checking if a player is offline
  offlinePlayers: string[];
}
// create empty playerData
export function newPlayersData(): GameRoomPlayersDataI {
  return {
    players: [],
    offlinePlayers: new Set(),
  };
}
// getOutputData
export function getPlayersFromData(
  room: GameRoomPlayersDataI,
): GameRoomPlayersI {
  const { players, offlinePlayers } = room;
  return {
    players,
    offlinePlayers: [...offlinePlayers],
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
  getPlayersFromData,
  gameRoomIsEmpty,
  isPlayerInRoom,
  validatePlayerInRoom,
} as const;

const setPlayerOfflineDef: UpdaterDef<
  [playerId: string, isOffline?: boolean]
> = (room, playerId, isOffline = false) => {
  // throw error if player is not in this room
  validatePlayerInRoom(room, playerId);

  // check if the new status is different from current one, and update if so
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
};

const setPlayerIsOffline = createUpdater(setPlayerOfflineDef);

// simple wrapper to call whenever a player does something, making sure they are not offline
const onPlayerAction = createUpdater((room, playerId: string) =>
  setPlayerIsOffline(room, playerId, false),
);

// split this logic out into an updaterFn to handle setting up the response logic for us, then we can chain easily
const justAddPlayer = createUpdater((room, playerId: string) => {
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
});

const addPlayer = createUpdater((room, playerId: string) => {
  const output = justAddPlayer(room, playerId);
  // chain/add step to make sure the player is online, regardless of if they were actually added
  return onPlayerAction(output, playerId);
});

const removePlayer = createUpdater((room, playerId: string) => {
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

export const updaters = {
  setPlayerIsOffline,
  onPlayerAction,
  addPlayer,
  removePlayer,
} as const;
