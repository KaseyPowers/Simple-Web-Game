import cryptoRandomString from "crypto-random-string";

import type {
  EventsWithErrorAck,
  ErrorAcknowledgementCallback,
} from "~/game_logic/util_types";

import type {
  ServerSocketType,
  ServerType,
  RemoteSocketType,
} from "./socket_types";
import type { ServerHelperUtilArgs } from "./util_types";
import type { GameRoomDataI, GameRoomI } from "./game_types";
import {
  getPlayersFromData,
  getPlayerUtils,
  createRoomPlayerData,
  roomIsEmpty,
} from "./players";
import {
  allSocketsLeaveRoom,
  hasSocketsInRoom,
  socketLeaveRoom,
  socketRooms,
  userIdLeaveRoom,
} from "./utils";

export interface SocketData {
  roomId?: string;
}

interface SharedEvents {
  leave_room: (roomId: string) => void;
}

export interface ServerToClientEvents extends SharedEvents {
  room_info: (data: GameRoomI) => void;
}

export type ClientToServerEvents = EventsWithErrorAck<
  SharedEvents & {
    join_room: (roomId: string) => void;
    create_room: () => void;
  }
>;

// export interface ClientToServerEvents extends EventsWithErrorAck<SharedEvents> {
//   join_room: (roomId: string, callback: ErrorAcknowledgementCallback) => void;
// }

export function getGameRoomFromData(data: GameRoomDataI): GameRoomI {
  const { roomId, chat } = data;
  const playerData = getPlayersFromData(data);
  return {
    roomId,
    chat,
    ...playerData,
  };
}

/**
 * Utils for handling a room,
 * NOTE: Need to figure out relationship between this and the room manager
 */
export function gameRoomLogic(options: ServerHelperUtilArgs) {
  const playerUtils = getPlayerUtils(options);
  const { io, socket, gameRooms } = options;

  function getRoom(roomId: string): GameRoomDataI | undefined {
    return gameRooms[roomId];
  }

  function createRoom(): GameRoomDataI {
    // setting roomId is last step before adding to the object
    // NOTE: using library to make a shorter id that will be easier to type manually into a browser if that's how it's being shared.
    const roomId = cryptoRandomString({ length: 6, type: "distinguishable" });

    // make sure this roomId isn't already in use
    if (gameRooms[roomId]) {
      throw new Error(
        `Somehow created a room for an id that already exists! roomId: ${roomId}`,
      );
    }
    // create the new room instance
    const room: GameRoomDataI = {
      roomId,
      ...createRoomPlayerData(),
      chat: [],
    };
    // add to the global tracker
    gameRooms[roomId] = room;
    // return reference to room
    return room;
  }

  async function closeRoom(roomOrId: string | GameRoomDataI) {
    const roomId = typeof roomOrId === "string" ? roomOrId : roomOrId.roomId;

    // delete reference to room from global state
    delete gameRooms[roomId];

    await allSocketsLeaveRoom(io, roomId);
  }

  //
  async function leaveRoom(roomOrId: string | GameRoomDataI) {
    // first make sure the room exists
    const room = typeof roomOrId === "string" ? getRoom(roomOrId) : roomOrId;

    const { userId } = socket.data;
    if (room) {
      // remove player and check if changed
      const madeChange = playerUtils.removePlayerFromRoom(room, userId);

      if (madeChange && roomIsEmpty(room)) {
        await closeRoom(room.roomId);
      }
    }
    const roomId = typeof roomOrId === "string" ? roomOrId : room?.roomId;
    if (!roomId) {
      throw new Error(
        "This shouldn't happen, if room wasn't found, should fallback to the passed in roomId string",
      );
    }
    return userIdLeaveRoom(io, userId, roomId);
  }

  // function for socket to join a room, adding sockets user to the room and updating socket state
  async function joinRoom(roomOrId: string | GameRoomDataI) {
    // first make sure the room exists
    const room = typeof roomOrId === "string" ? getRoom(roomOrId) : roomOrId;
    if (!room) {
      throw new Error("No room found for this roomId!");
    }
    const { roomId } = room;
    const { roomId: currentRoomId, userId } = socket.data;
    // next check if the player is already in a room, and if it's different than the previous room
    if (currentRoomId && currentRoomId !== roomId) {
      // leave the room
      socketLeaveRoom(socket, currentRoomId);
      // now check if this counts sa the player leaving the room (if other sockets are still in this room)
      const stillInRoom = await hasSocketsInRoom(io, currentRoomId, userId);
      if (!stillInRoom) {
        await leaveRoom(room);
      }
    }
    // add player before joining, that way even if the player change emitting emits to this socket, it won't send redundant data with the room_info event
    playerUtils.addPlayerToRoom(room, userId);
    void socket.join(socketRooms.roomId(roomId));
    socket.data.roomId = roomId;
    socket.emit("room_info", getGameRoomFromData(room));
  }

  socket.on("create_room", async (callback) => {
    try {
      const room = createRoom();
      await joinRoom(room);
    } catch (err) {
      let message = "Something went wrong creating the room!";
      if (typeof err === "string") {
        message = err;
      } else if (err instanceof Error) {
        message = err.message;
      }
      callback({ message });
    }
  });
  socket.on("join_room", async (roomId, callback) => {
    try {
      await joinRoom(roomId);
    } catch (err) {
      let message = "Something went wrong creating the room!";
      if (typeof err === "string") {
        message = err;
      } else if (err instanceof Error) {
        message = err.message;
      }
      callback({ message });
    }
  });
}
