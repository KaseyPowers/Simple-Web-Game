import type {
  GameRoomDataI,
  RoomPlayersDataI,
  RoomPlayersI,
} from "./game_types";

import type { ServerHelperUtilArgs } from "./socket_types";
import { inGameRoom } from "./utils";

export interface ServerToClientEvents {
  players_update: (roomId: string, playerData: RoomPlayersI) => void;
}
export function createRoomPlayerData(): RoomPlayersDataI {
  return {
    players: [],
    offlinePlayers: new Set(),
  };
}
// get the derived data (worry about checking for changes elsewhere)
export function getPlayersFromData(data: GameRoomDataI): RoomPlayersI {
  const { players, offlinePlayers } = data;
  return {
    players,
    offlinePlayers: [...offlinePlayers].reduce((obj, offlineId) => {
      obj[offlineId] = true;
      return obj;
    }, {}),
  };
}
// will return true if room has any players in it
export function roomIsEmpty(data: GameRoomDataI) {
  return data.players.length <= 0;
}
// util checker for validation on actions that require player being in the room
export function playerInRoom(data: GameRoomDataI, userId: string) {
  return data.players.includes(userId);
}

/**
 * Util functions for modifying player data, return true if data changed
 */
function setPlayerIsOffline(
  room: GameRoomDataI,
  userId: string,
  isOffilne = false,
): boolean {
  // being in the set means the user is offline, compare to the desired state passed in
  if (room.offlinePlayers.has(userId) !== isOffilne) {
    // if setting it offline, add it to the set, otherwise remove it
    if (isOffilne) {
      room.offlinePlayers.add(userId);
    } else {
      room.offlinePlayers.delete(userId);
    }
    return true;
  }
  return false;
}
function addPlayer(room: GameRoomDataI, userId: string): boolean {
  let madeChanges = false;
  if (!playerInRoom(room, userId)) {
    room.players.push(userId);
    madeChanges = true;
  }
  // make sure player is online
  madeChanges = madeChanges || setPlayerIsOffline(room, userId, false);
  // return if changes were made
  return madeChanges;
}

export function removePlayer(room: GameRoomDataI, userId: string): boolean {
  let madeChange = false;
  if (playerInRoom(room, userId)) {
    // filter out the userId from players
    room.players = room.players.filter((playerId) => playerId !== userId);
    madeChange = true;
  }
  // remove from offline tracker if not in room anymore
  if (room.offlinePlayers.has(userId)) {
    room.offlinePlayers.delete(userId);
    if (!madeChange) {
      throw new Error(
        `Removed user ${userId} from offlinePlayers but didn't remove it from the players list. This shouldn't be possible`,
      );
    }
    madeChange = true;
  }
  return madeChange;
}

/**
 * socket related utils for players
 *
 * Only using Utils for players.
 * all modifications to the player data are either:
 * - handled automatically by server (offline/online status)
 * - handled by room managing logic (joinging/leaving the room)
 */
export function getPlayerUtils({ socket }: ServerHelperUtilArgs) {
  /** Emit the player data to clients. fromSocket flag if the socket is used to send to all but current socket, otherwise will send to all in the room including the source */
  function emitPlayerData(room: GameRoomDataI) {
    inGameRoom(socket, room.roomId).emit(
      "players_update",
      room.roomId,
      getPlayersFromData(room),
    );
  }

  const onSetPlayerOffline: typeof setPlayerIsOffline = (room, ...args) => {
    const madeChanges = setPlayerIsOffline(room, ...args);
    if (madeChanges) {
      emitPlayerData(room);
    }
    return madeChanges;
  };
  // wrapperFn/alias used to verify a player is online when performing an action. (not to be mixed with other player changing functions that could result in multiple emits);
  const onUserAction = (room: GameRoomDataI, userId: string) =>
    onSetPlayerOffline(room, userId, false);

  const addPlayerToRoom: typeof addPlayer = (room, ...args) => {
    const madeChanges = addPlayer(room, ...args);
    if (madeChanges) {
      emitPlayerData(room);
    }
    return madeChanges;
  };

  const removePlayerFromRoom: typeof removePlayer = (room, ...args) => {
    const madeChanges = removePlayer(room, ...args);
    if (madeChanges) {
      emitPlayerData(room);
    }
    return madeChanges;
  };

  return {
    // emit event to give player data
    emitPlayerData,
    onSetPlayerOffline,
    onUserAction,
    addPlayerToRoom,
    removePlayerFromRoom,
  };
}
