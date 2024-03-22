import type { ServerType, ServerSocketType } from "~/types/socket";

// import type { ChatDataI } from "./room_types";

import GameRoom from "./room";

export function roomHandlers(io: ServerType, socket: ServerSocketType) {
  // on create_room, start a room with this new userId
  socket.on("create_room", () => {
    const room = new GameRoom(socket.data.userId);
    // join this server.
    void socket.join(room.roomId);
    socket.emit("roomInfo", room.getData());
  });

  socket.on("join_room", (roomId) => {
    const room = GameRoom.allRoomsData[roomId];
    if (!room) {
      throw new Error("Tried joining a room that didn't exist");
    }
    // join room class and also the socket room
    const playersChanged = room.onJoin(socket.data.userId);
    // always try joining the room in case a user has multiple tabs open
    void socket.join(room.roomId);
    /**
     * TODO: give new/joining player the full room data needed not just update the players.
     */
    socket.emit("roomInfo", room.getData());

    // only send update event if a change happend
    if (playersChanged) {
      socket.to(room.roomId).emit("players_update", room.players);
    }
  });

  socket.on("leave_room", (roomId) => {
    const room = GameRoom.allRoomsData[roomId];
    if (!room) {
      // don't throw error leaving a room, could be a race condition leaving as someone started closing it
      return;
    }
    const hasChange = room.onLeave(socket.data.userId);
    void socket.leave(room.roomId);

    if (hasChange) {
      // if room was closed, emit different event
      if (!GameRoom.allRoomsData[roomId]) {
        io.emit("room_closed", roomId);
      } else {
        socket.to(room.roomId).emit("players_update", room.players);
      }
    }
  });

  socket.on("message", (msg) => {
    const room = GameRoom.allRoomsData[msg.roomId];
    if (!room) {
      throw new Error("Tried messaging a room that didn't exist");
    }
    // add the message to the room store and then rebroadcast to group
    room.addChatMessage(msg);
    socket.to(room.roomId).emit("message", msg);
  });
}
