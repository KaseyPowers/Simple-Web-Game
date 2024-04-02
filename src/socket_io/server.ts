import { Server } from "socket.io";

import type { Server as NetServer } from "net";

import { roomHandlers } from "../game_logic/game_room/room_handlers";

import type { ServerType, ServerSocketType } from "./socket_types";
import { socketRoomUtils } from "./socket_utils";
import { socketPath } from "./socket_configs";

export function getSocketServer(netServer: NetServer): ServerType {
  // @ts-expect-error this server pattern from example and not sure how to dig into this deep of types to fix
  const io: ServerType = new Server(netServer, {
    path: socketPath,
  });

  // have the userID logic always on, but just verify that it exists.
  // NOTE: might want to add a check against the database stuff to verify userIDs?
  io.use((socket, next) => {
    const userId: false | string =
      typeof socket.handshake.auth.userId === "string" &&
      socket.handshake.auth.userId;
    if (!userId) {
      return next(new Error("Missing UserId"));
    }
    socket.data.userId = userId;
    next();
  });

  return io;
}

export default function buildServerSocket(netServer: NetServer): ServerType {
  const io = getSocketServer(netServer);

  const onConnection = (socket: ServerSocketType) => {
    // doing this in connection to verify that the room is joined even on reconnection
    void socketRoomUtils.joinUserIdRoom(socket, socket.data.userId);
    roomHandlers(io, socket);
  };

  io.on("connection", onConnection);
  return io;
}
