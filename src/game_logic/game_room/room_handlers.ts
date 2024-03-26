import type { RemoteSocket } from "socket.io";
import type { ServerType, ServerSocketType } from "~/socket_io/socket_types";
import type { RoomServerToClientEvents, RoomSocketData } from "./room_types";

import GameRoom from "./room";

/**
 * NOTES:
 * - a user can be in multiple rooms across multiple tabs (unless we block this somehow?)
 * - a user can have multiple tabs/sockets in the same room
 *
 * - if leaving a room by event, assume kicking out all of that users tabs from that room
 * - if disconnecting a socket, two options for how that's handled:
 * - - check if other sockets for the user are in the room already. Then if none left, user leaves room as well immediately
 * - - add a delay and then check if other user has any sockets in the room.
 *
 *
 * TODO:
 * - Periodically clear out rooms. Checking for empty/inactive rooms
 */

/** function checks if there are any sockets for this userId also in the room */
const hasSocketsInRoom = async (
  io: ServerType,
  userId: string,
  roomId: string,
): Promise<boolean> => {
  // can only do AND joins with rooms it seems, so just fetching all sockets with this userID. In most cases (user not in multiple tabs) this will be an empty array and will be a quick check.
  // In an ideal world we would just do a `.in(userID) AND .in(roomId)
  const matched = await io.in(userId).fetchSockets();

  // check each returned socket for being in the room for expected GameRoom
  return matched.some((socket) => socket.rooms.has(roomId));
};

/** Close the game room and send leave event to all sockets in the socket-room */
const closeRoom = async (io: ServerType, roomId: string) => {
  // check if room exists still, and delete it if so
  GameRoom.closeRoom(roomId);
  // fetch all the sockets that use this room Id, then make sure they leave this room and send event to update
  const sockets = await io.in(roomId).fetchSockets();

  for (const socket of sockets) {
    socketLeaveRoom(socket, roomId);
  }
};

/** Check for all sockets tied to user and have them leave the gameRoom */
const userLeaveRoom = async (
  io: ServerType,
  userId: string,
  roomId: string,
) => {
  // fetch all sockets for this user and make sure they also leave the gameRoom
  const sockets = await io.in(userId).local.fetchSockets();
  for (const socket of sockets) {
    socketLeaveRoom(socket, roomId);
  }
};

// using remoteSocket to use what seems to be a minimum definition needed that is also returned by the fetchSockets() fn for closeRoom above
function socketLeaveRoom(
  socket:
    | ServerSocketType
    | RemoteSocket<RoomServerToClientEvents, RoomSocketData>,
  roomId: string,
) {
  // assume there is no issue leaving a room if the socket isn't in that room already
  void socket.leave(roomId);

  // skip modifying data if data doesn't indicate we are in the room already.
  if (socket.data.roomId === roomId) {
    socket.data.roomId = undefined;
  }

  // emit to self.
  socket.emit("leave_room", roomId);
}

export function roomHandlers(io: ServerType, socket: ServerSocketType) {
  // join the socket-room, and add roomId to the data
  function joinRoom(room: GameRoom) {
    void socket.join(room.roomId);
    socket.data.roomId = room.roomId;
    socket.emit("room_info", room.getData());
  }

  // leave room callback, defined seperately so it can be used by the disconnect event too
  async function leaveRoom(userId: string, roomId: string) {
    const room = GameRoom.findRoom(roomId);
    // only do room logic if room exists
    if (room) {
      // fn returns true if player was in room to leave
      const hasChange = room.removePlayer(userId);
      if (hasChange) {
        // if this was last player to leave, close the room
        if (room.isEmpty) {
          // closeRoom handles having sockets leave, so return
          await closeRoom(io, roomId);
          return;
        }
        onPlayerDataChange(room);
      }
    }
    await userLeaveRoom(io, userId, roomId);
  }

  // leave room fn has 2 modes, one to remove user completely from room, and one for just removing this socket with a check if that means leaving the room completely
  async function thisSocketLeaveRoom() {
    // grab the userId and current roomId
    const { userId, roomId } = socket.data;
    // return early if no roomId assigned yet
    if (!roomId) {
      return;
    }
    // have socket leave room. NOTE: Might not behave as expected if the `.leave` is actually async (it's unclear in docs but can return a promise)
    socketLeaveRoom(socket, roomId);
    // once socket left, check if any other sockets in the room. if this was only socket connected, stillInRoom will be false now.
    const stillInRoom = await hasSocketsInRoom(io, userId, roomId);

    if (!stillInRoom) {
      await leaveRoom(userId, roomId);
    }
  }

  function onPlayerDataChange(room: GameRoom) {
    socket
      .to(room.roomId)
      .emit("players_update", room.roomId, room.getPlayerData());
  }

  // on create_room, start a room with this new userId
  socket.on("create_room", () => {
    const room = new GameRoom(socket.data.userId);
    // join this server.
    joinRoom(room);
  });

  socket.on("join_room", async (roomId, callback) => {
    // first step is make sure the roomId is even valid
    const room = GameRoom.findRoom(roomId);
    if (!room) {
      callback("Sorry! That room doesn't exist");
      return;
    }
    // if switching rooms, slight changes to how we handle it
    if (socket.data.roomId) {
      // already in this room, so no point in doing the rest
      if (socket.data.roomId === roomId) {
        // return callback true for a valid room or should it return a message about already being in the room?
        callback(true);
        return;
      } else {
        // leave current room before joining new one. Only for current socket
        await thisSocketLeaveRoom();
      }
    }
    // join room class and also the socket room
    const playersChanged = room.addPlayer(socket.data.userId);
    // always try joining the room in case a user has multiple tabs open
    joinRoom(room);

    // only send update event if a change happend
    if (playersChanged) {
      onPlayerDataChange(room);
    }
    callback(true);
  });

  type setStatusFnType = (
    room: GameRoom,
    ...args: Parameters<GameRoom["setPlayerStatus"]>
  ) => void;

  const setPlayerStatus: setStatusFnType = (room, userId, status) => {
    // assuming room+userId is already verified before calling this function
    const hasChange = room.setPlayerStatus(userId, status);
    if (hasChange) {
      onPlayerDataChange(room);
    }
  };

  socket.on("disconnect", async () => {
    const { userId, roomId } = socket.data;
    const room = roomId && GameRoom.findRoom(roomId);
    // room handlers only care about disconnect if the socket is in a room
    if (!room) {
      return;
    }

    // check if user is fully disconnected from the room;
    const isDisconnectedFromRoom = !(await hasSocketsInRoom(
      io,
      userId,
      roomId,
    ));
    /**
     * We will delay removing a player from the room if reconnecting or whatnot, will show them "offline" until then.
     *
     * However if the user is already connected in another tab, then they are still considered online!
     */

    if (isDisconnectedFromRoom) {
      // set them to offline
      setPlayerStatus(room, userId, false);

      setTimeout(() => {
        // wrap async logic in fn then call
        const fn = async () => {
          const stillDisconnected = !(await hasSocketsInRoom(
            io,
            userId,
            roomId,
          ));
          // if there are still no sockets connected, leave the room completely
          if (stillDisconnected) {
            await leaveRoom(userId, roomId);
          }
        };
        void fn();
      }, 30 * 1000 /** 30 second delay? could change/make variable */);
    }
  });

  // leaving room is a manual action, so consider it performed for all sockets belonging to the same user
  socket.on("leave_room", (roomId) => {
    if (socket.data.roomId !== roomId) {
      throw new Error(
        `Socket received an event for room: ${roomId}, but socket is tied to room: ${socket.data.roomId}`,
      );
    }
    void leaveRoom(socket.data.userId, roomId);
  });

  socket.on("message", (msg) => {
    if (socket.data.roomId !== msg.roomId) {
      throw new Error(
        `Socket received a message for room: ${msg.roomId}, but socket is tied to room: ${socket.data.roomId}`,
      );
    }
    // should only be receiving msg from sockets user, otherwise something hacky going on
    if (socket.data.userId !== msg.userId) {
      throw new Error(
        `Socket received a message from: ${msg.userId}, but socket is tied to userId: ${socket.data.userId}`,
      );
    }

    const room = GameRoom.findRoom(msg.roomId);
    if (!room) {
      throw new Error("Tried messaging a room that didn't exist");
    }
    // add the message to the room store and then rebroadcast to group
    room.addChatMessage(msg);
    socket.to(room.roomId).emit("message", msg);
    setPlayerStatus(room, socket.data.userId);
  });
}
